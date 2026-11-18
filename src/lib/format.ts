export function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("التاريخ غير صالح");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error("التاريخ غير صالح");
  }
  return date;
}

export function toIsoDate(value: Date | string) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("ar-SY-u-nu-latn", { dateStyle: "medium" }).format(new Date(value));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-SY-u-nu-latn").format(value);
}

export function formatNationalId(value: string) {
  return value.replace(/(\d{4})(\d{4})(\d{2})/, "$1 $2 $3");
}

export function ageYears(birth: Date | string, on: Date | string) {
  const from = new Date(birth);
  const to = new Date(on);
  let years = to.getFullYear() - from.getFullYear();
  const month = to.getMonth() - from.getMonth();
  if (month < 0 || (month === 0 && to.getDate() < from.getDate())) years -= 1;
  return years;
}

export function isFuture(date: Date) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return date.getTime() > end.getTime();
}

export function fullName(person: {
  firstName: string;
  fatherName: string;
  grandfatherName: string;
  familyName: string;
}) {
  return [person.firstName, person.fatherName, person.grandfatherName, person.familyName].join(" ");
}

export function pageNumber(value: string | undefined) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 1;
}
