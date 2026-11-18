import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { writeAudit } from "./audit";
import { assertMarriageParties, assertNotFuture, assertParentEligible, nextDocumentNo } from "./civil-rules";
import { AppError } from "./errors";
import { fullName, parseIsoDate } from "./format";
import { prisma } from "./prisma";
import { actingSector, assertCentral, assertIssuer, assertSector, assertTransfer, assertWriter, canManageUsers } from "./rbac";
import { ROLES, type SessionUser } from "./types";

const note = z
  .string()
  .trim()
  .max(400, "الملاحظات طويلة")
  .optional()
  .transform((value) => value || undefined);

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "التاريخ غير صالح");
const namePart = (label: string) => z.string().trim().min(2, `${label} قصير`).max(40, `${label} طويل`);

const birthSchema = z.object({
  firstName: namePart("الاسم"),
  fatherName: namePart("اسم الأب"),
  grandfatherName: namePart("اسم الجد"),
  familyName: namePart("اسم العائلة"),
  gender: z.enum(["MALE", "FEMALE"]),
  birthDate: dateText,
  birthPlace: z.string().trim().min(2, "حدد مكان الولادة").max(80),
  fatherId: z.string().min(5, "حدد الأب من نتائج البحث"),
  motherId: z.string().min(5, "حدد الأم من نتائج البحث"),
  notes: note,
  sectorId: z.string().optional(),
});

const deathSchema = z.object({
  personId: z.string().min(5, "حدد الفرد"),
  eventDate: dateText,
  place: z.string().trim().min(2, "حدد مكان الوفاة").max(80),
  cause: note,
  notes: note,
});

const marriageSchema = z.object({
  husbandId: z.string().min(5, "حدد الزوج"),
  wifeId: z.string().min(5, "حدد الزوجة"),
  eventDate: dateText,
  place: z.string().trim().min(2, "حدد مكان العقد").max(80),
  notes: note,
  sectorId: z.string().optional(),
});

const divorceSchema = z.object({
  marriageId: z.string().min(5, "حدد عقد الزواج"),
  eventDate: dateText,
  place: z.string().trim().min(2, "حدد مكان الطلاق").max(80),
  notes: note,
});

const identitySchema = z.object({
  personId: z.string().min(5, "حدد الفرد"),
  mode: z.enum(["issue", "renew", "cancel"]),
});

const transferSchema = z.object({
  personId: z.string().min(5, "حدد الفرد"),
  sectorId: z.string().min(5, "حدد القطاع الجديد"),
});

const placeSchema = z.object({
  birthPlace: z.string().trim().min(2, "مكان الولادة قصير").max(80, "مكان الولادة طويل"),
});

const userSchema = z.object({
  name: z.string().trim().min(3, "الاسم قصير").max(80),
  email: z.string().trim().email("البريد غير صالح").max(120),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(80),
  role: z.enum(ROLES),
  sectorId: z.string().optional(),
});

const sectorSchema = z.object({
  name: z.string().trim().min(2, "اسم القطاع قصير").max(80),
  active: z.boolean(),
});

function read<T>(schema: z.ZodType<T>, data: unknown) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message || "بيانات غير مكتملة");
  return parsed.data;
}

function asDate(value: string) {
  try {
    return parseIsoDate(value);
  } catch {
    throw new AppError("التاريخ غير صالح");
  }
}

async function requireActiveSector(tx: Prisma.TransactionClient, sectorId: string) {
  const sector = await tx.sector.findUnique({ where: { id: sectorId } });
  if (!sector || !sector.active) throw new AppError("هذا القطاع موقوف أو غير موجود");
  return sector;
}

async function generateNationalId(tx: Prisma.TransactionClient) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const nationalId = String(Math.floor(1000000000 + Math.random() * 9000000000));
    const existing = await tx.person.findUnique({ where: { nationalId }, select: { id: true } });
    if (!existing) return nationalId;
  }
  throw new AppError("تعذر توليد رقم وطني");
}

async function moveIntoBook(tx: Prisma.TransactionClient, personId: string, familyBookId: string, relation: string) {
  await tx.familyMember.updateMany({
    where: { personId, active: true, NOT: { familyBookId } },
    data: { active: false },
  });
  await tx.familyMember.upsert({
    where: { familyBookId_personId: { familyBookId, personId } },
    create: { familyBookId, personId, relation, active: true },
    update: { relation, active: true, joinedAt: new Date() },
  });
}

async function bookForChild(tx: Prisma.TransactionClient, fatherId: string, fatherSectorId: string, sectorCode: string) {
  const memberships = await tx.familyMember.findMany({ where: { personId: fatherId, active: true } });
  const headed = memberships.find((member) => member.relation === "HEAD");
  if (headed) return headed.familyBookId;
  if (memberships[0]) return memberships[0].familyBookId;
  const number = await nextDocumentNo(tx, "FAM", sectorCode, new Date().getFullYear());
  const book = await tx.familyBook.create({
    data: { number, sectorId: fatherSectorId, headId: fatherId, openedAt: new Date() },
  });
  await tx.familyMember.create({ data: { familyBookId: book.id, personId: fatherId, relation: "HEAD", active: true } });
  return book.id;
}

export async function registerBirth(user: SessionUser, input: unknown) {
  const data = read(birthSchema, input);
  const sectorId = actingSector(user, data.sectorId);
  const birthDate = asDate(data.birthDate);
  assertNotFuture(birthDate);
  if (data.fatherId === data.motherId) throw new AppError("لا يمكن أن يكون الأب والأم الشخص نفسه");

  const created = await prisma.$transaction(async (tx) => {
    const sector = await requireActiveSector(tx, sectorId);
    const father = await tx.person.findUnique({ where: { id: data.fatherId }, include: { deathRecord: true } });
    const mother = await tx.person.findUnique({ where: { id: data.motherId }, include: { deathRecord: true } });
    if (!father || !mother) throw new AppError("تعذر العثور على أحد الوالدين", 404);
    if (father.sectorId !== sectorId || mother.sectorId !== sectorId) {
      throw new AppError("يجب أن يكون الأب والأم من سكان القطاع الذي تُسجل فيه الولادة");
    }
    assertParentEligible(
      { birthDate: father.birthDate, gender: father.gender, lifeStatus: father.lifeStatus, deathDate: father.deathRecord?.eventDate ?? null },
      birthDate,
      "FATHER",
    );
    assertParentEligible(
      { birthDate: mother.birthDate, gender: mother.gender, lifeStatus: mother.lifeStatus, deathDate: mother.deathRecord?.eventDate ?? null },
      birthDate,
      "MOTHER",
    );
    const person = await tx.person.create({
      data: {
        nationalId: await generateNationalId(tx),
        firstName: data.firstName,
        fatherName: data.fatherName,
        grandfatherName: data.grandfatherName,
        familyName: data.familyName,
        gender: data.gender,
        birthDate,
        birthPlace: data.birthPlace,
        lifeStatus: "ALIVE",
        maritalStatus: "SINGLE",
        fatherId: father.id,
        motherId: mother.id,
        sectorId,
      },
    });
    const documentNo = await nextDocumentNo(tx, "BIR", sector.code, birthDate.getFullYear());
    const record = await tx.birthRecord.create({
      data: {
        documentNo,
        personId: person.id,
        fatherId: father.id,
        motherId: mother.id,
        eventDate: birthDate,
        place: data.birthPlace,
        sectorId,
        registrarId: user.id,
        notes: data.notes,
      },
    });
    const bookId = await bookForChild(tx, father.id, father.sectorId, sector.code);
    await moveIntoBook(tx, person.id, bookId, "CHILD");
    return { personId: person.id, documentNo, documentId: record.id, name: fullName(person), sectorId };
  });

  await writeAudit({
    user,
    sectorId: created.sectorId,
    entityType: "BirthRecord",
    entityId: created.documentId,
    action: "REGISTER_BIRTH",
    summary: `تسجيل ولادة ${created.name} بالوثيقة ${created.documentNo}`,
  });
  return created;
}

export async function registerDeath(user: SessionUser, input: unknown) {
  assertWriter(user);
  const data = read(deathSchema, input);
  const eventDate = asDate(data.eventDate);
  assertNotFuture(eventDate);

  const created = await prisma.$transaction(async (tx) => {
    const person = await tx.person.findUnique({
      where: { id: data.personId },
      include: { deathRecord: true, sector: true },
    });
    if (!person) throw new AppError("الفرد غير موجود", 404);
    assertSector(user, person.sectorId);
    if (person.deathRecord || person.lifeStatus === "DECEASED") throw new AppError("الوفاة مسجلة مسبقًا لهذا الفرد");
    if (eventDate < person.birthDate) throw new AppError("تاريخ الوفاة يسبق تاريخ الولادة");
    await requireActiveSector(tx, person.sectorId);
    const documentNo = await nextDocumentNo(tx, "DTH", person.sector.code, eventDate.getFullYear());
    const record = await tx.deathRecord.create({
      data: {
        documentNo,
        personId: person.id,
        eventDate,
        place: data.place,
        cause: data.cause,
        sectorId: person.sectorId,
        registrarId: user.id,
        notes: data.notes,
      },
    });
    await tx.person.update({ where: { id: person.id }, data: { lifeStatus: "DECEASED" } });
    await tx.identityCard.updateMany({
      where: { personId: person.id, status: "ACTIVE" },
      data: { status: "CANCELLED", cancelReason: "DEATH" },
    });
    const marriages = await tx.marriageRecord.findMany({
      where: { status: "ACTIVE", OR: [{ spouse1Id: person.id }, { spouse2Id: person.id }] },
    });
    for (const marriage of marriages) {
      const spouseId = marriage.spouse1Id === person.id ? marriage.spouse2Id : marriage.spouse1Id;
      await tx.marriageRecord.update({ where: { id: marriage.id }, data: { status: "WIDOWED" } });
      await tx.person.update({ where: { id: spouseId }, data: { maritalStatus: "WIDOWED" } });
    }
    return { personId: person.id, documentNo, documentId: record.id, name: fullName(person), sectorId: person.sectorId };
  });

  await writeAudit({
    user,
    sectorId: created.sectorId,
    entityType: "DeathRecord",
    entityId: created.documentId,
    action: "REGISTER_DEATH",
    summary: `تسجيل وفاة ${created.name} بالوثيقة ${created.documentNo}، مع إلغاء الهوية السارية`,
  });
  return created;
}

export async function registerMarriage(user: SessionUser, input: unknown) {
  const data = read(marriageSchema, input);
  const sectorId = actingSector(user, data.sectorId);
  const eventDate = asDate(data.eventDate);
  assertNotFuture(eventDate);

  const created = await prisma.$transaction(async (tx) => {
    const sector = await requireActiveSector(tx, sectorId);
    const husband = await tx.person.findUnique({ where: { id: data.husbandId } });
    const wife = await tx.person.findUnique({ where: { id: data.wifeId } });
    if (!husband || !wife) throw new AppError("تعذر العثور على أحد طرفي العقد", 404);
    if (husband.sectorId !== sectorId || wife.sectorId !== sectorId) {
      throw new AppError("يجب أن يكون الزوجان من سكان القطاع الذي يصدر العقد");
    }
    assertMarriageParties(husband, wife, eventDate);
    const activeCount = await tx.marriageRecord.count({
      where: {
        status: "ACTIVE",
        OR: [{ spouse1Id: husband.id }, { spouse2Id: husband.id }, { spouse1Id: wife.id }, { spouse2Id: wife.id }],
      },
    });
    if (activeCount > 0) throw new AppError("أحد الطرفين مرتبط بزواج قائم");
    const documentNo = await nextDocumentNo(tx, "MAR", sector.code, eventDate.getFullYear());
    const record = await tx.marriageRecord.create({
      data: {
        documentNo,
        spouse1Id: husband.id,
        spouse2Id: wife.id,
        eventDate,
        place: data.place,
        status: "ACTIVE",
        sectorId,
        registrarId: user.id,
        notes: data.notes,
      },
    });
    await tx.person.update({ where: { id: husband.id }, data: { maritalStatus: "MARRIED" } });
    await tx.person.update({ where: { id: wife.id }, data: { maritalStatus: "MARRIED" } });
    const headed = await tx.familyMember.findFirst({ where: { personId: husband.id, active: true, relation: "HEAD" } });
    let bookId = headed?.familyBookId;
    let opened = false;
    if (!bookId) {
      const number = await nextDocumentNo(tx, "FAM", sector.code, eventDate.getFullYear());
      const book = await tx.familyBook.create({
        data: { number, sectorId: husband.sectorId, headId: husband.id, openedAt: eventDate },
      });
      bookId = book.id;
      opened = true;
      await moveIntoBook(tx, husband.id, bookId, "HEAD");
    }
    await moveIntoBook(tx, wife.id, bookId, "SPOUSE");
    const book = await tx.familyBook.findUnique({ where: { id: bookId } });
    return {
      documentId: record.id,
      documentNo,
      personId: husband.id,
      sectorId,
      summary: opened
        ? `عقد زواج ${documentNo} وفتح دفتر ${book?.number} للزوج وأُلحقت به الزوجة`
        : `عقد زواج ${documentNo} وأُلحقت الزوجة بدفتر ${book?.number}`,
    };
  });

  await writeAudit({
    user,
    sectorId: created.sectorId,
    entityType: "MarriageRecord",
    entityId: created.documentId,
    action: "REGISTER_MARRIAGE",
    summary: created.summary,
  });
  return created;
}

export async function registerDivorce(user: SessionUser, input: unknown) {
  assertWriter(user);
  const data = read(divorceSchema, input);
  const eventDate = asDate(data.eventDate);
  assertNotFuture(eventDate);

  const created = await prisma.$transaction(async (tx) => {
    const marriage = await tx.marriageRecord.findUnique({
      where: { id: data.marriageId },
      include: { divorce: true, sector: true, spouse1: true, spouse2: true },
    });
    if (!marriage) throw new AppError("عقد الزواج غير موجود", 404);
    assertSector(user, marriage.sectorId);
    if (marriage.status !== "ACTIVE" || marriage.divorce) throw new AppError("هذا العقد غير قائم أو سبق إنهاؤه");
    if (marriage.spouse1.lifeStatus !== "ALIVE" || marriage.spouse2.lifeStatus !== "ALIVE") {
      throw new AppError("الطلاق يكون بين زوجين على قيد الحياة");
    }
    if (eventDate < marriage.eventDate) throw new AppError("تاريخ الطلاق يسبق تاريخ الزواج");
    await requireActiveSector(tx, marriage.sectorId);
    const documentNo = await nextDocumentNo(tx, "DIV", marriage.sector.code, eventDate.getFullYear());
    const record = await tx.divorceRecord.create({
      data: {
        documentNo,
        marriageId: marriage.id,
        eventDate,
        place: data.place,
        sectorId: marriage.sectorId,
        registrarId: user.id,
        notes: data.notes,
      },
    });
    await tx.marriageRecord.update({ where: { id: marriage.id }, data: { status: "DIVORCED" } });
    await tx.person.update({ where: { id: marriage.spouse1Id }, data: { maritalStatus: "DIVORCED" } });
    await tx.person.update({ where: { id: marriage.spouse2Id }, data: { maritalStatus: "DIVORCED" } });
    return { documentId: record.id, documentNo, personId: marriage.spouse1Id, sectorId: marriage.sectorId };
  });

  await writeAudit({
    user,
    sectorId: created.sectorId,
    entityType: "DivorceRecord",
    entityId: created.documentId,
    action: "REGISTER_DIVORCE",
    summary: `تسجيل طلاق ${created.documentNo} وإغلاق عقد الزواج`,
  });
  return created;
}

export async function registerIdentity(user: SessionUser, input: unknown) {
  assertIssuer(user);
  const data = read(identitySchema, input);
  const created = await prisma.$transaction(async (tx) => {
    const person = await tx.person.findUnique({ where: { id: data.personId }, include: { sector: true } });
    if (!person) throw new AppError("الفرد غير موجود", 404);
    assertSector(user, person.sectorId);
    if (person.lifeStatus !== "ALIVE") throw new AppError("لا تُصدر هوية لمتوفى");
    if (!person.firstName || !person.fatherName || !person.grandfatherName || !person.familyName || !person.birthDate) {
      throw new AppError("سجل الفرد غير مكتمل");
    }
    await requireActiveSector(tx, person.sectorId);
    const active = await tx.identityCard.findFirst({ where: { personId: person.id, status: "ACTIVE" } });
    if (data.mode === "cancel") {
      if (!active) throw new AppError("لا توجد بطاقة سارية");
      await tx.identityCard.update({ where: { id: active.id }, data: { status: "CANCELLED", cancelReason: "MANUAL" } });
      return { personId: person.id, documentId: active.id, documentNo: active.cardNo, sectorId: person.sectorId, summary: `إلغاء الهوية ${active.cardNo}` };
    }
    if (data.mode === "issue" && active) throw new AppError("توجد بطاقة سارية. استخدم التجديد");
    if (data.mode === "renew" && !active) throw new AppError("لا توجد بطاقة سارية للتجديد");
    if (active) {
      await tx.identityCard.update({ where: { id: active.id }, data: { status: "CANCELLED", cancelReason: "RENEWAL" } });
    }
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getFullYear() + 10, issuedAt.getMonth(), issuedAt.getDate(), 12);
    const cardNo = await nextDocumentNo(tx, "ID", person.sector.code, issuedAt.getFullYear());
    const card = await tx.identityCard.create({
      data: {
        cardNo,
        personId: person.id,
        issuedAt,
        expiresAt,
        status: "ACTIVE",
        sectorId: person.sectorId,
        issuerId: user.id,
      },
    });
    return {
      personId: person.id,
      documentId: card.id,
      documentNo: cardNo,
      sectorId: person.sectorId,
      summary: data.mode === "renew" ? `تجديد الهوية ${cardNo}` : `إصدار الهوية ${cardNo} لـ ${fullName(person)}`,
    };
  });

  await writeAudit({
    user,
    sectorId: created.sectorId,
    entityType: "IdentityCard",
    entityId: created.documentId,
    action: "IDENTITY",
    summary: created.summary,
  });
  return created;
}

export async function transferResidence(user: SessionUser, input: unknown) {
  assertTransfer(user);
  const data = read(transferSchema, input);
  const moved = await prisma.$transaction(async (tx) => {
    const person = await tx.person.findUnique({ where: { id: data.personId }, include: { sector: true } });
    const target = await tx.sector.findUnique({ where: { id: data.sectorId } });
    if (!person || !target) throw new AppError("تعذر إتمام النقل", 404);
    if (!target.active) throw new AppError("لا يمكن النقل إلى قطاع موقوف");
    if (person.sectorId === target.id) throw new AppError("الفرد مقيم أصلًا في هذا القطاع");
    await tx.person.update({ where: { id: person.id }, data: { sectorId: target.id } });
    return {
      personId: person.id,
      documentId: person.id,
      sectorId: target.id,
      summary: `نقل إقامة ${fullName(person)} من ${person.sector.name} إلى ${target.name}. الوثائق السابقة تبقى صادرة من قطاعها`,
    };
  });
  await writeAudit({
    user,
    sectorId: moved.sectorId,
    entityType: "Person",
    entityId: moved.personId,
    action: "TRANSFER",
    summary: moved.summary,
  });
  return moved;
}

export async function updateBirthPlace(user: SessionUser, personId: string, input: unknown) {
  assertWriter(user);
  const data = read(placeSchema, input);
  const person = await prisma.person.findUnique({ where: { id: personId } });
  if (!person) throw new AppError("الفرد غير موجود", 404);
  assertSector(user, person.sectorId);
  await prisma.person.update({ where: { id: person.id }, data: { birthPlace: data.birthPlace } });
  await writeAudit({
    user,
    sectorId: person.sectorId,
    entityType: "Person",
    entityId: person.id,
    action: "UPDATE_PLACE",
    summary: `تعديل مكان ولادة ${fullName(person)} إلى ${data.birthPlace}`,
  });
  return { personId: person.id };
}

export async function createUser(actor: SessionUser, input: unknown) {
  if (!canManageUsers(actor)) throw new AppError("ليست لديك صلاحية إدارة المستخدمين", 403);
  const data = read(userSchema, input);
  const email = data.email.toLowerCase();
  let sectorId: string | null = null;
  if (actor.role === "SECTOR_MANAGER") {
    if (data.role !== "REGISTRAR" && data.role !== "ANALYST") {
      throw new AppError("يمكنك إنشاء موظف سجل أو محلل ضمن قطاعك فقط", 403);
    }
    sectorId = actor.sectorId;
  } else if (data.role === "CENTRAL_ADMIN") {
    sectorId = null;
  } else if (data.role === "ANALYST") {
    sectorId = data.sectorId || null;
  } else if (!data.sectorId) {
    throw new AppError("حدد القطاع");
  } else {
    sectorId = data.sectorId;
  }
  if (sectorId) {
    const sector = await prisma.sector.findUnique({ where: { id: sectorId } });
    if (!sector) throw new AppError("القطاع غير موجود", 404);
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("البريد مستخدم مسبقًا");
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: data.role,
      sectorId,
    },
  });
  await writeAudit({
    user: actor,
    sectorId,
    entityType: "User",
    entityId: user.id,
    action: "CREATE_USER",
    summary: `إنشاء حساب ${user.name} (${user.role})`,
  });
  return { id: user.id };
}

export async function setUserActive(actor: SessionUser, userId: string, active: boolean) {
  if (!canManageUsers(actor)) throw new AppError("ليست لديك صلاحية إدارة المستخدمين", 403);
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new AppError("المستخدم غير موجود", 404);
  if (target.id === actor.id) throw new AppError("لا يمكنك إيقاف حسابك");
  if (actor.role === "SECTOR_MANAGER") {
    if (target.sectorId !== actor.sectorId) throw new AppError("لا يمكنك تعديل مستخدم خارج قطاعك", 403);
    if (target.role !== "REGISTRAR" && target.role !== "ANALYST") {
      throw new AppError("لا يمكنك تعديل هذا الحساب", 403);
    }
  }
  await prisma.user.update({ where: { id: target.id }, data: { active } });
  await writeAudit({
    user: actor,
    sectorId: target.sectorId,
    entityType: "User",
    entityId: target.id,
    action: active ? "ACTIVATE_USER" : "DEACTIVATE_USER",
    summary: `${active ? "تفعيل" : "إيقاف"} حساب ${target.name}`,
  });
  return { id: target.id };
}

export async function updateSector(user: SessionUser, sectorId: string, input: unknown) {
  assertCentral(user);
  const data = read(sectorSchema, input);
  const sector = await prisma.sector.findUnique({ where: { id: sectorId } });
  if (!sector) throw new AppError("القطاع غير موجود", 404);
  await prisma.sector.update({ where: { id: sector.id }, data: { name: data.name, active: data.active } });
  await writeAudit({
    user,
    sectorId: sector.id,
    entityType: "Sector",
    entityId: sector.id,
    action: "UPDATE_SECTOR",
    summary: `تحديث القطاع ${sector.code}: ${data.name} (${data.active ? "نشط" : "موقوف"})`,
  });
  return { id: sector.id };
}
