import type { Prisma } from "@prisma/client";
import { AppError } from "./errors";
import { ageYears, isFuture } from "./format";

type Kin = {
  id: string;
  gender: string;
  fatherId: string | null;
  motherId: string | null;
};

type ParentFacts = {
  birthDate: Date;
  gender: string;
  lifeStatus: string;
  deathDate: Date | null;
};

export function isDirectMahram(left: Kin, right: Kin) {
  if (left.id === right.id) return true;
  const parentChild =
    left.fatherId === right.id ||
    left.motherId === right.id ||
    right.fatherId === left.id ||
    right.motherId === left.id;
  if (parentChild) return true;
  const siblings =
    (!!left.fatherId && left.fatherId === right.fatherId) || (!!left.motherId && left.motherId === right.motherId);
  return siblings;
}

export function assertNotFuture(date: Date) {
  if (isFuture(date)) throw new AppError("لا يمكن تسجيل واقعة بتاريخ مستقبلي");
}

export function assertParentEligible(parent: ParentFacts, childDate: Date, kind: "FATHER" | "MOTHER") {
  const label = kind === "FATHER" ? "الأب" : "الأم";
  const expected = kind === "FATHER" ? "MALE" : "FEMALE";
  if (parent.gender !== expected) throw new AppError(`${label} المسجّل لا يطابق الجنس المتوقع`);
  if (parent.deathDate && parent.deathDate < childDate) {
    throw new AppError(`${label} متوفى قبل تاريخ الولادة`);
  }
  if (!parent.deathDate && parent.lifeStatus === "DECEASED") {
    throw new AppError(`${label} متوفى ولا يمكن اعتماد الولادة بلا تاريخ وفاة`);
  }
  const age = ageYears(parent.birthDate, childDate);
  const max = kind === "FATHER" ? 75 : 55;
  if (age < 16 || age > max) {
    throw new AppError(`عمر ${label} وقت الولادة غير منطقي (${age} عامًا)`);
  }
}

export function assertMarriageParties(
  husband: Kin & { gender: string; lifeStatus: string; maritalStatus: string; birthDate: Date },
  wife: Kin & { gender: string; lifeStatus: string; maritalStatus: string; birthDate: Date },
  on: Date,
) {
  if (husband.id === wife.id) throw new AppError("لا يمكن أن يتطابق طرفا العقد");
  if (husband.gender !== "MALE" || wife.gender !== "FEMALE") {
    throw new AppError("يُسجل الزوج ذكرًا والزوجة أنثى");
  }
  if (husband.lifeStatus !== "ALIVE" || wife.lifeStatus !== "ALIVE") {
    throw new AppError("لا يُعقد الزواج لغير الأحياء");
  }
  if (ageYears(husband.birthDate, on) < 18 || ageYears(wife.birthDate, on) < 18) {
    throw new AppError("يشترط بلوغ الطرفين 18 عامًا في تاريخ العقد");
  }
  if (husband.maritalStatus === "MARRIED" || wife.maritalStatus === "MARRIED") {
    throw new AppError("أحد الطرفين مرتبط بزواج قائم");
  }
  if (isDirectMahram(husband, wife)) {
    throw new AppError("لا يجوز الزواج بين الأصول أو الفروع أو الإخوة المسجّلين");
  }
}

const prefixOf = (code: string, kind: string, year: number) => `${code}-${kind}-${year}-`;

function serial(prefix: string, existing: string[]) {
  const max = existing.reduce((highest, value) => Math.max(highest, Number(value.slice(prefix.length)) || 0), 0);
  return `${prefix}${String(max + 1).padStart(5, "0")}`;
}

export async function nextDocumentNo(
  tx: Prisma.TransactionClient,
  kind: "BIR" | "DTH" | "MAR" | "DIV" | "ID" | "FAM",
  code: string,
  year: number,
) {
  const prefix = prefixOf(code, kind, year);
  if (kind === "BIR") {
    const rows = await tx.birthRecord.findMany({ where: { documentNo: { startsWith: prefix } }, select: { documentNo: true } });
    return serial(prefix, rows.map((row) => row.documentNo));
  }
  if (kind === "DTH") {
    const rows = await tx.deathRecord.findMany({ where: { documentNo: { startsWith: prefix } }, select: { documentNo: true } });
    return serial(prefix, rows.map((row) => row.documentNo));
  }
  if (kind === "MAR") {
    const rows = await tx.marriageRecord.findMany({ where: { documentNo: { startsWith: prefix } }, select: { documentNo: true } });
    return serial(prefix, rows.map((row) => row.documentNo));
  }
  if (kind === "DIV") {
    const rows = await tx.divorceRecord.findMany({ where: { documentNo: { startsWith: prefix } }, select: { documentNo: true } });
    return serial(prefix, rows.map((row) => row.documentNo));
  }
  if (kind === "ID") {
    const rows = await tx.identityCard.findMany({ where: { cardNo: { startsWith: prefix } }, select: { cardNo: true } });
    return serial(prefix, rows.map((row) => row.cardNo));
  }
  const rows = await tx.familyBook.findMany({ where: { number: { startsWith: prefix } }, select: { number: true } });
  return serial(prefix, rows.map((row) => row.number));
}
