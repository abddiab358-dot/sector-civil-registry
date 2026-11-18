import { readFileSync } from "fs";

for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const match = /^([^#=]+)=(.*)$/.exec(line.trim());
  if (!match) continue;
  const key = match[1].trim();
  if (!process.env[key]) process.env[key] = match[2].trim().replace(/^"|"$/g, "");
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { getPerson } = await import("../src/lib/queries");
  const { registerBirth, registerDeath, registerDivorce, registerIdentity, registerMarriage } = await import("../src/lib/registry");

  const users = await prisma.user.findMany({ include: { sector: true } });
  const asUser = (email: string): import("../src/lib/types").SessionUser => {
    const user = users.find((item) => item.email === email);
    if (!user) throw new Error(email);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as import("../src/lib/types").Role,
      sectorId: user.sectorId,
      sectorName: user.sector?.name ?? null,
      sectorCode: user.sector?.code ?? null,
    };
  };

  const north = asUser("fadi.n@registry.local");
  const south = asUser("sami.s@registry.local");
  const analyst = asUser("rami.a@registry.local");
  const manager = asUser("nora.n@registry.local");
  const ziad = await prisma.person.findFirst({ where: { firstName: "زياد", familyName: "عودة" } });
  const seen = await getPerson(north, ziad!.id);
  assert(seen === null, "موظف الشمال رأى فردًا جنوبيًا");

  const samir = await prisma.person.findFirst({ where: { firstName: "سمير", familyName: "الخطيب", gender: "MALE" } });
  const nour = await prisma.person.findFirst({ where: { firstName: "نور", familyName: "الخطيب" } });
  await expectFail(() =>
    registerMarriage(north, {
      husbandId: samir!.id,
      wifeId: nour!.id,
      eventDate: isoDaysAgo(10),
      place: "محكمة القطاع الشمالي",
    }),
  );

  const hassan = await prisma.person.findFirst({ where: { firstName: "حسن", familyName: "الخطيب", lifeStatus: "DECEASED" } });
  const fatima = await prisma.person.findFirst({ where: { firstName: "فاطمة", familyName: "حمدان" } });
  await expectFail(() =>
    registerBirth(north, {
      firstName: "اختبار",
      fatherName: "حسن",
      grandfatherName: "محمود",
      familyName: "الخطيب",
      gender: "MALE",
      birthDate: "2021-01-01",
      birthPlace: "مشفى الشمال المركزي",
      fatherId: hassan!.id,
      motherId: fatima!.id,
    }),
  );

  const child = await prisma.person.findFirst({ where: { firstName: "عمر", familyName: "الخطيب", fatherName: "أحمد" } });
  const maya = await prisma.person.findFirst({ where: { firstName: "مايا", familyName: "بركات" } });
  await expectFail(() =>
    registerMarriage(north, {
      husbandId: child!.id,
      wifeId: maya!.id,
      eventDate: isoDaysAgo(3),
      place: "محكمة القطاع الشمالي",
    }),
  );

  await expectFail(() =>
    registerBirth(analyst, {
      firstName: "ممنوع",
      fatherName: "أحمد",
      grandfatherName: "حسن",
      familyName: "الخطيب",
      gender: "FEMALE",
      birthDate: isoDaysAgo(1),
      birthPlace: "مشفى الشمال المركزي",
      fatherId: samir!.id,
      motherId: nour!.id,
      sectorId: north.sectorId,
    }),
  );

  const yusuf = await prisma.person.findFirst({ where: { firstName: "يوسف", familyName: "الخطيب", fatherName: "أحمد" } });
  const huda = await prisma.person.findFirst({ where: { firstName: "هدى", familyName: "المصري" } });
  const birth = await registerBirth(north, {
    firstName: "جنى",
    fatherName: "يوسف",
    grandfatherName: "أحمد",
    familyName: "الخطيب",
    gender: "FEMALE",
    birthDate: isoDaysAgo(20),
    birthPlace: "مشفى الشمال المركزي",
    fatherId: yusuf!.id,
    motherId: huda!.id,
  });
  const membership = await prisma.familyMember.findFirst({
    where: { personId: birth.personId, active: true, relation: "CHILD" },
    include: { familyBook: true },
  });
  assert(membership?.familyBook.headId === yusuf!.id, "المولود لم يدخل دفتر الأب");

  const jad = await prisma.person.findFirst({ where: { firstName: "جاد", familyName: "عبود" } });
  const card = await registerIdentity(manager, { personId: jad!.id, mode: "issue" });
  assert(card.documentNo.includes("-ID-"), "لم تُصدر هوية");

  const waleed = await prisma.person.findFirst({ where: { firstName: "وليد", familyName: "عبود" } });
  await registerDeath(north, {
    personId: waleed!.id,
    eventDate: isoDaysAgo(2),
    place: "مشفى الشمال المركزي",
    cause: "تحقق",
  });
  const cancelled = await prisma.identityCard.findFirst({ where: { personId: waleed!.id, status: "ACTIVE" } });
  assert(cancelled === null, "الهوية بقيت سارية بعد الوفاة");
  await expectFail(() =>
    registerMarriage(north, {
      husbandId: waleed!.id,
      wifeId: maya!.id,
      eventDate: isoDaysAgo(1),
      place: "محكمة القطاع الشمالي",
    }),
  );

  const ziadPerson = ziad!;
  const leen = await prisma.person.findFirst({ where: { firstName: "لين", familyName: "يوسف" } });
  const married = await registerMarriage(south, {
    husbandId: ziadPerson.id,
    wifeId: leen!.id,
    eventDate: isoDaysAgo(12),
    place: "محكمة القطاع الجنوبي",
  });
  const divorced = await registerDivorce(south, {
    marriageId: married.documentId,
    eventDate: isoDaysAgo(2),
    place: "محكمة القطاع الجنوبي",
  });
  assert(divorced.documentNo.includes("-DIV-"), "لم يُسجل الطلاق");
  await expectFail(() =>
    registerDivorce(south, {
      marriageId: married.documentId,
      eventDate: isoDaysAgo(1),
      place: "محكمة القطاع الجنوبي",
    }),
  );
  await expectFail(() =>
    registerDeath(north, { personId: ziadPerson.id, eventDate: isoDaysAgo(1), place: "مشفى الشمال المركزي" }),
  );

  console.log("نجحت فحوصات القواعد والصلاحيات");
}

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

async function expectFail(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    const { AppError } = await import("../src/lib/errors");
    if (error instanceof AppError) return;
    throw error;
  }
  throw new Error("كان يُتوقع رفض العملية");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
