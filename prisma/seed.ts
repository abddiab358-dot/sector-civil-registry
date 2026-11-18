import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const password = "Demo@2026";

type SectorCode = "N" | "C" | "S";
type Gender = "MALE" | "FEMALE";
type Life = "ALIVE" | "DECEASED";
type Marital = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
type PersonSeed = {
  key: string;
  first: string;
  father: string;
  grand: string;
  family: string;
  gender: Gender;
  birth: string;
  sector: SectorCode;
  life?: Life;
  marital?: Marital;
  fatherKey?: string;
  motherKey?: string;
  death?: string;
};

const people: PersonSeed[] = [
  { key: "hassan", first: "حسن", father: "محمود", grand: "يوسف", family: "الخطيب", gender: "MALE", birth: "1948-03-12", sector: "N", life: "DECEASED", marital: "MARRIED", death: "2020-11-02" },
  { key: "fatima", first: "فاطمة", father: "أحمد", grand: "صالح", family: "حمدان", gender: "FEMALE", birth: "1952-06-01", sector: "N", marital: "WIDOWED" },
  { key: "omarN", first: "عمر", father: "سعيد", grand: "خليل", family: "النجار", gender: "MALE", birth: "1950-01-20", sector: "N", marital: "MARRIED" },
  { key: "samia", first: "سامية", father: "يوسف", grand: "أمين", family: "درويش", gender: "FEMALE", birth: "1954-08-08", sector: "N", marital: "MARRIED" },
  { key: "kamal", first: "كمال", father: "سامي", grand: "رشيد", family: "عبود", gender: "MALE", birth: "1970-02-02", sector: "N", marital: "MARRIED" },
  { key: "salma", first: "سلمى", father: "حسام", grand: "علي", family: "شاهين", gender: "FEMALE", birth: "1972-05-16", sector: "N", marital: "MARRIED" },
  { key: "nabil", first: "نبيل", father: "فؤاد", grand: "سليم", family: "بركات", gender: "MALE", birth: "1968-03-03", sector: "N", marital: "MARRIED" },
  { key: "lamia", first: "لميا", father: "جميل", grand: "أنور", family: "حداد", gender: "FEMALE", birth: "1971-09-19", sector: "N", marital: "MARRIED" },
  { key: "tarek", first: "طارق", father: "نبيل", grand: "كمال", family: "المصري", gender: "MALE", birth: "1976-04-02", sector: "N", marital: "MARRIED" },
  { key: "ruba", first: "ربى", father: "وليد", grand: "حسن", family: "قاسم", gender: "FEMALE", birth: "1980-11-11", sector: "N", marital: "MARRIED" },
  { key: "ahmad", first: "أحمد", father: "حسن", grand: "محمود", family: "الخطيب", gender: "MALE", birth: "1975-04-18", sector: "N", marital: "MARRIED", fatherKey: "hassan", motherKey: "fatima" },
  { key: "samir", first: "سمير", father: "حسن", grand: "محمود", family: "الخطيب", gender: "MALE", birth: "1978-09-09", sector: "N", fatherKey: "hassan", motherKey: "fatima" },
  { key: "nour", first: "نور", father: "حسن", grand: "محمود", family: "الخطيب", gender: "FEMALE", birth: "1981-01-22", sector: "N", fatherKey: "hassan", motherKey: "fatima" },
  { key: "layla", first: "ليلى", father: "عمر", grand: "سعيد", family: "النجار", gender: "FEMALE", birth: "1978-02-14", sector: "N", marital: "MARRIED", fatherKey: "omarN", motherKey: "samia" },
  { key: "jad", first: "جاد", father: "كمال", grand: "سامي", family: "عبود", gender: "MALE", birth: "1996-06-16", sector: "N", fatherKey: "kamal", motherKey: "salma" },
  { key: "waleed", first: "وليد", father: "كمال", grand: "سامي", family: "عبود", gender: "MALE", birth: "1999-01-05", sector: "N", fatherKey: "kamal", motherKey: "salma" },
  { key: "maya", first: "مايا", father: "نبيل", grand: "فؤاد", family: "بركات", gender: "FEMALE", birth: "1997-09-21", sector: "N", fatherKey: "nabil", motherKey: "lamia" },
  { key: "huda", first: "هدى", father: "طارق", grand: "نبيل", family: "المصري", gender: "FEMALE", birth: "2003-08-30", sector: "N", marital: "MARRIED", fatherKey: "tarek", motherKey: "ruba" },
  { key: "yusuf", first: "يوسف", father: "أحمد", grand: "حسن", family: "الخطيب", gender: "MALE", birth: "2002-07-19", sector: "N", marital: "MARRIED", fatherKey: "ahmad", motherKey: "layla" },
  { key: "mariam", first: "مريم", father: "أحمد", grand: "حسن", family: "الخطيب", gender: "FEMALE", birth: "2005-12-03", sector: "N", fatherKey: "ahmad", motherKey: "layla" },
  { key: "lina", first: "لينا", father: "أحمد", grand: "حسن", family: "الخطيب", gender: "FEMALE", birth: "2012-02-02", sector: "N", fatherKey: "ahmad", motherKey: "layla" },
  { key: "omar", first: "عمر", father: "أحمد", grand: "حسن", family: "الخطيب", gender: "MALE", birth: "2016-05-11", sector: "N", fatherKey: "ahmad", motherKey: "layla" },
  { key: "karam", first: "كرم", father: "أحمد", grand: "حسن", family: "الخطيب", gender: "MALE", birth: "2023-04-04", sector: "N", fatherKey: "ahmad", motherKey: "layla" },
  { key: "hana", first: "هناء", father: "أحمد", grand: "حسن", family: "الخطيب", gender: "FEMALE", birth: "2025-03-08", sector: "N", fatherKey: "ahmad", motherKey: "layla" },
  { key: "imad", first: "عماد", father: "زياد", grand: "كامل", family: "الحمد", gender: "MALE", birth: "1960-05-05", sector: "C", life: "DECEASED", marital: "MARRIED", death: "2023-04-12" },
  { key: "wahiba", first: "وهيبة", father: "سامي", grand: "نادر", family: "عيسى", gender: "FEMALE", birth: "1963-07-19", sector: "C", marital: "WIDOWED" },
  { key: "adil", first: "عادل", father: "هاني", grand: "لؤي", family: "القاسم", gender: "MALE", birth: "1965-01-09", sector: "C", marital: "MARRIED" },
  { key: "najat", first: "نجاة", father: "بسام", grand: "عمر", family: "شحادة", gender: "FEMALE", birth: "1968-10-10", sector: "C", marital: "MARRIED" },
  { key: "fadiP", first: "فادي", father: "باسل", grand: "كريم", family: "علي", gender: "MALE", birth: "1961-04-04", sector: "C", marital: "MARRIED" },
  { key: "inas", first: "إيناس", father: "محمود", grand: "سليم", family: "نصر", gender: "FEMALE", birth: "1964-12-12", sector: "C", marital: "MARRIED" },
  { key: "nader", first: "نادر", father: "فتحي", grand: "عبدالقادر", family: "حمد", gender: "MALE", birth: "1955-08-08", sector: "C" },
  { key: "wael", first: "وائل", father: "عماد", grand: "زياد", family: "الحمد", gender: "MALE", birth: "1990-10-10", sector: "C", marital: "MARRIED", fatherKey: "imad", motherKey: "wahiba" },
  { key: "dina", first: "دينا", father: "عادل", grand: "هاني", family: "القاسم", gender: "FEMALE", birth: "1992-03-03", sector: "C", marital: "MARRIED", fatherKey: "adil", motherKey: "najat" },
  { key: "majed", first: "ماجد", father: "عماد", grand: "زياد", family: "الحمد", gender: "MALE", birth: "1984-02-17", sector: "C", marital: "DIVORCED", fatherKey: "imad", motherKey: "wahiba" },
  { key: "rana", first: "رنا", father: "فادي", grand: "باسل", family: "علي", gender: "FEMALE", birth: "1986-11-09", sector: "C", marital: "DIVORCED", fatherKey: "fadiP", motherKey: "inas" },
  { key: "husam", first: "حسام", father: "مروان", grand: "جمال", family: "خوري", gender: "MALE", birth: "1995-04-04", sector: "C" },
  { key: "dana", first: "دانا", father: "سمير", grand: "نهاد", family: "فرح", gender: "FEMALE", birth: "1994-12-12", sector: "C" },
  { key: "bassel", first: "باسل", father: "عادل", grand: "هاني", family: "القاسم", gender: "MALE", birth: "2006-06-06", sector: "C", fatherKey: "adil", motherKey: "najat" },
  { key: "layan", first: "ليان", father: "ماجد", grand: "عماد", family: "الحمد", gender: "FEMALE", birth: "2012-06-06", sector: "C", fatherKey: "majed", motherKey: "rana" },
  { key: "qasem", first: "قاسم", father: "وائل", grand: "عماد", family: "الحمد", gender: "MALE", birth: "2020-08-08", sector: "C", fatherKey: "wael", motherKey: "dina" },
  { key: "adam", first: "آدم", father: "وائل", grand: "عماد", family: "الحمد", gender: "MALE", birth: "2019-08-22", sector: "C", fatherKey: "wael", motherKey: "dina" },
  { key: "linaB", first: "لينة", father: "وائل", grand: "عماد", family: "الحمد", gender: "FEMALE", birth: "2024-12-01", sector: "C", fatherKey: "wael", motherKey: "dina" },
  { key: "omarC", first: "عمرو", father: "وائل", grand: "عماد", family: "الحمد", gender: "MALE", birth: "2025-05-20", sector: "C", fatherKey: "wael", motherKey: "dina" },
  { key: "yousif", first: "يوسف", father: "عبدالله", grand: "صالح", family: "فهد", gender: "MALE", birth: "1944-02-02", sector: "S", life: "DECEASED", marital: "MARRIED", death: "2019-01-08" },
  { key: "khadija", first: "خديجة", father: "إبراهيم", grand: "يوسف", family: "منصور", gender: "FEMALE", birth: "1946-07-07", sector: "S", marital: "WIDOWED" },
  { key: "jamil", first: "جميل", father: "عبدالرحمن", grand: "سعيد", family: "طه", gender: "MALE", birth: "1958-03-15", sector: "S" },
  { key: "fakhri", first: "فخري", father: "محمد", grand: "أمين", family: "درويش", gender: "MALE", birth: "1950-09-01", sector: "S", life: "DECEASED", death: "2025-02-02" },
  { key: "saleh", first: "صالح", father: "يوسف", grand: "عبدالله", family: "فهد", gender: "MALE", birth: "1982-01-15", sector: "S", marital: "MARRIED", fatherKey: "yousif", motherKey: "khadija" },
  { key: "aya", first: "آية", father: "حاتم", grand: "كمال", family: "سعد", gender: "FEMALE", birth: "1985-09-09", sector: "S", marital: "MARRIED" },
  { key: "omarS", first: "أسامة", father: "خالد", grand: "يوسف", family: "عمران", gender: "MALE", birth: "1979-11-23", sector: "S", marital: "MARRIED" },
  { key: "heba", first: "هبة", father: "سامر", grand: "علي", family: "حسين", gender: "FEMALE", birth: "1983-04-28", sector: "S", marital: "MARRIED" },
  { key: "murad", first: "مراد", father: "لؤي", grand: "حسن", family: "ضاهر", gender: "MALE", birth: "1993-02-02", sector: "S", marital: "MARRIED" },
  { key: "rubaS", first: "رباب", father: "فواز", grand: "أحمد", family: "خطار", gender: "FEMALE", birth: "1995-06-18", sector: "S", marital: "MARRIED" },
  { key: "ziad", first: "زياد", father: "ماهر", grand: "سليم", family: "عودة", gender: "MALE", birth: "1998-03-30", sector: "S" },
  { key: "leen", first: "لين", father: "باسل", grand: "كرم", family: "يوسف", gender: "FEMALE", birth: "1999-10-02", sector: "S" },
  { key: "hiba", first: "هبة", father: "صالح", grand: "يوسف", family: "فهد", gender: "FEMALE", birth: "2006-01-17", sector: "S", fatherKey: "saleh", motherKey: "aya" },
  { key: "faris", first: "فارس", father: "صالح", grand: "يوسف", family: "فهد", gender: "MALE", birth: "2008-07-07", sector: "S", fatherKey: "saleh", motherKey: "aya" },
  { key: "jana", first: "جنى", father: "صالح", grand: "يوسف", family: "فهد", gender: "FEMALE", birth: "2011-03-14", sector: "S", fatherKey: "saleh", motherKey: "aya" },
  { key: "karim", first: "كريم", father: "صالح", grand: "يوسف", family: "فهد", gender: "MALE", birth: "2014-09-09", sector: "S", fatherKey: "saleh", motherKey: "aya" },
  { key: "tala", first: "تالا", father: "صالح", grand: "يوسف", family: "فهد", gender: "FEMALE", birth: "2018-12-12", sector: "S", fatherKey: "saleh", motherKey: "aya" },
  { key: "rayan", first: "ريان", father: "صالح", grand: "يوسف", family: "فهد", gender: "MALE", birth: "2021-01-19", sector: "S", fatherKey: "saleh", motherKey: "aya" },
  { key: "mass", first: "ماس", father: "صالح", grand: "يوسف", family: "فهد", gender: "MALE", birth: "2023-11-02", sector: "S", fatherKey: "saleh", motherKey: "aya" },
  { key: "noura", first: "نورا", father: "صالح", grand: "يوسف", family: "فهد", gender: "FEMALE", birth: "2026-01-20", sector: "S", fatherKey: "saleh", motherKey: "aya" },
  { key: "ali", first: "علي", father: "أسامة", grand: "خالد", family: "عمران", gender: "MALE", birth: "2015-05-05", sector: "S", fatherKey: "omarS", motherKey: "heba" },
  { key: "lamiaS", first: "لمى", father: "مراد", grand: "لؤي", family: "ضاهر", gender: "FEMALE", birth: "2022-05-05", sector: "S", fatherKey: "murad", motherKey: "rubaS" },
];

const marriages: { key: string; husband: string; wife: string; date: string; sector: SectorCode; status: "ACTIVE" | "DIVORCED" | "WIDOWED" }[] = [
  { key: "m-hassan", husband: "hassan", wife: "fatima", date: "1974-05-20", sector: "N", status: "WIDOWED" },
  { key: "m-omarN", husband: "omarN", wife: "samia", date: "1973-04-12", sector: "N", status: "ACTIVE" },
  { key: "m-kamal", husband: "kamal", wife: "salma", date: "1994-02-18", sector: "N", status: "ACTIVE" },
  { key: "m-nabil", husband: "nabil", wife: "lamia", date: "1993-07-07", sector: "N", status: "ACTIVE" },
  { key: "m-tarek", husband: "tarek", wife: "ruba", date: "1999-09-09", sector: "N", status: "ACTIVE" },
  { key: "m-ahmad", husband: "ahmad", wife: "layla", date: "2001-06-20", sector: "N", status: "ACTIVE" },
  { key: "m-yusuf", husband: "yusuf", wife: "huda", date: "2024-07-01", sector: "N", status: "ACTIVE" },
  { key: "m-imad", husband: "imad", wife: "wahiba", date: "1983-08-18", sector: "C", status: "WIDOWED" },
  { key: "m-adil", husband: "adil", wife: "najat", date: "1988-01-21", sector: "C", status: "ACTIVE" },
  { key: "m-fadi", husband: "fadiP", wife: "inas", date: "1984-04-04", sector: "C", status: "ACTIVE" },
  { key: "m-wael", husband: "wael", wife: "dina", date: "2016-05-05", sector: "C", status: "ACTIVE" },
  { key: "m-majed", husband: "majed", wife: "rana", date: "2011-03-15", sector: "C", status: "DIVORCED" },
  { key: "m-yousif", husband: "yousif", wife: "khadija", date: "1968-06-06", sector: "S", status: "WIDOWED" },
  { key: "m-saleh", husband: "saleh", wife: "aya", date: "2005-10-10", sector: "S", status: "ACTIVE" },
  { key: "m-omarS", husband: "omarS", wife: "heba", date: "2006-02-14", sector: "S", status: "ACTIVE" },
  { key: "m-murad", husband: "murad", wife: "rubaS", date: "2021-04-12", sector: "S", status: "ACTIVE" },
];

const books: { sector: SectorCode; head: string; opened: string; members: [string, "HEAD" | "SPOUSE" | "CHILD", boolean][] }[] = [
  { sector: "N", head: "hassan", opened: "1974-05-20", members: [["hassan", "HEAD", true], ["fatima", "SPOUSE", true], ["ahmad", "CHILD", false], ["samir", "CHILD", true], ["nour", "CHILD", true]] },
  { sector: "N", head: "ahmad", opened: "2001-06-20", members: [["ahmad", "HEAD", true], ["layla", "SPOUSE", true], ["yusuf", "CHILD", false], ["mariam", "CHILD", true], ["lina", "CHILD", true], ["omar", "CHILD", true], ["karam", "CHILD", true], ["hana", "CHILD", true]] },
  { sector: "N", head: "yusuf", opened: "2024-07-01", members: [["yusuf", "HEAD", true], ["huda", "SPOUSE", true]] },
  { sector: "N", head: "omarN", opened: "1973-04-12", members: [["omarN", "HEAD", true], ["samia", "SPOUSE", true], ["layla", "CHILD", false]] },
  { sector: "N", head: "kamal", opened: "1994-02-18", members: [["kamal", "HEAD", true], ["salma", "SPOUSE", true], ["jad", "CHILD", true], ["waleed", "CHILD", true]] },
  { sector: "N", head: "nabil", opened: "1993-07-07", members: [["nabil", "HEAD", true], ["lamia", "SPOUSE", true], ["maya", "CHILD", true]] },
  { sector: "N", head: "tarek", opened: "1999-09-09", members: [["tarek", "HEAD", true], ["ruba", "SPOUSE", true], ["huda", "CHILD", false]] },
  { sector: "C", head: "imad", opened: "1983-08-18", members: [["imad", "HEAD", true], ["wahiba", "SPOUSE", true], ["wael", "CHILD", false], ["majed", "CHILD", false]] },
  { sector: "C", head: "wael", opened: "2016-05-05", members: [["wael", "HEAD", true], ["dina", "SPOUSE", true], ["qasem", "CHILD", true], ["adam", "CHILD", true], ["linaB", "CHILD", true], ["omarC", "CHILD", true]] },
  { sector: "C", head: "majed", opened: "2011-03-15", members: [["majed", "HEAD", true], ["layan", "CHILD", true], ["rana", "SPOUSE", false]] },
  { sector: "C", head: "rana", opened: "2022-09-15", members: [["rana", "HEAD", true]] },
  { sector: "C", head: "adil", opened: "1988-01-21", members: [["adil", "HEAD", true], ["najat", "SPOUSE", true], ["dina", "CHILD", false], ["bassel", "CHILD", true]] },
  { sector: "C", head: "fadiP", opened: "1984-04-04", members: [["fadiP", "HEAD", true], ["inas", "SPOUSE", true], ["rana", "CHILD", false]] },
  { sector: "C", head: "nader", opened: "1955-08-08", members: [["nader", "HEAD", true]] },
  { sector: "C", head: "husam", opened: "1995-04-04", members: [["husam", "HEAD", true]] },
  { sector: "C", head: "dana", opened: "1994-12-12", members: [["dana", "HEAD", true]] },
  { sector: "S", head: "yousif", opened: "1968-06-06", members: [["yousif", "HEAD", true], ["khadija", "SPOUSE", true], ["saleh", "CHILD", false]] },
  { sector: "S", head: "saleh", opened: "2005-10-10", members: [["saleh", "HEAD", true], ["aya", "SPOUSE", true], ["hiba", "CHILD", true], ["faris", "CHILD", true], ["jana", "CHILD", true], ["karim", "CHILD", true], ["tala", "CHILD", true], ["rayan", "CHILD", true], ["mass", "CHILD", true], ["noura", "CHILD", true]] },
  { sector: "S", head: "omarS", opened: "2006-02-14", members: [["omarS", "HEAD", true], ["heba", "SPOUSE", true], ["ali", "CHILD", true]] },
  { sector: "S", head: "murad", opened: "2021-04-12", members: [["murad", "HEAD", true], ["rubaS", "SPOUSE", true], ["lamiaS", "CHILD", true]] },
  { sector: "S", head: "ziad", opened: "1998-03-30", members: [["ziad", "HEAD", true]] },
  { sector: "S", head: "leen", opened: "1999-10-02", members: [["leen", "HEAD", true]] },
  { sector: "S", head: "jamil", opened: "1958-03-15", members: [["jamil", "HEAD", true]] },
  { sector: "S", head: "fakhri", opened: "1950-09-01", members: [["fakhri", "HEAD", true]] },
];

const hospitals: Record<SectorCode, string> = {
  N: "مشفى الشمال المركزي",
  C: "مشفى الوسط الوطني",
  S: "مشفى الجنوب العام",
};
const courts: Record<SectorCode, string> = {
  N: "محكمة القطاع الشمالي",
  C: "محكمة القطاع الأوسط",
  S: "محكمة القطاع الجنوبي",
};

function at(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function years(from: string, to: string) {
  const start = at(from);
  const end = at(to);
  let age = end.getFullYear() - start.getFullYear();
  if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())) age -= 1;
  return age;
}

function assertSeed() {
  const byKey = new Map(people.map((person) => [person.key, person]));
  if (byKey.size !== people.length) throw new Error("مفاتيح الأفراد مكررة");
  for (const person of people) {
    if (person.fatherKey) {
      const father = byKey.get(person.fatherKey);
      if (!father || father.gender !== "MALE") throw new Error(`أب غير صالح: ${person.key}`);
      const age = years(father.birth, person.birth);
      if (age < 16 || age > 75) throw new Error(`عمر الأب غير منطقي: ${person.key} ${age}`);
      if (father.death && father.death < person.birth) throw new Error(`الأب متوفى قبل الولادة: ${person.key}`);
    }
    if (person.motherKey) {
      const mother = byKey.get(person.motherKey);
      if (!mother || mother.gender !== "FEMALE") throw new Error(`أم غير صالحة: ${person.key}`);
      const age = years(mother.birth, person.birth);
      if (age < 16 || age > 55) throw new Error(`عمر الأم غير منطقي: ${person.key} ${age}`);
    }
  }
  for (const marriage of marriages) {
    const husband = byKey.get(marriage.husband);
    const wife = byKey.get(marriage.wife);
    if (!husband || !wife || husband.gender !== "MALE" || wife.gender !== "FEMALE") throw new Error(`زواج غير صالح: ${marriage.key}`);
    if (husband.sector !== wife.sector || husband.sector !== marriage.sector) throw new Error(`قطاع الزواج: ${marriage.key}`);
    if (years(husband.birth, marriage.date) < 18 || years(wife.birth, marriage.date) < 18) throw new Error(`قاصر في الزواج: ${marriage.key}`);
  }
  const seen = new Set(books.flatMap((book) => book.members.map((member) => member[0])));
  for (const person of people) {
    if (!seen.has(person.key)) throw new Error(`بلا دفتر: ${person.key}`);
  }
}

function take(seq: Map<string, number>, code: string, kind: string, year: number) {
  const key = `${code}-${kind}-${year}`;
  const next = (seq.get(key) ?? 0) + 1;
  seq.set(key, next);
  return `${key}-${String(next).padStart(5, "0")}`;
}

async function clear() {
  await prisma.auditLog.deleteMany();
  await prisma.divorceRecord.deleteMany();
  await prisma.marriageRecord.deleteMany();
  await prisma.deathRecord.deleteMany();
  await prisma.birthRecord.deleteMany();
  await prisma.identityCard.deleteMany();
  await prisma.familyMember.deleteMany();
  await prisma.familyBook.deleteMany();
  await prisma.person.updateMany({ data: { fatherId: null, motherId: null } });
  await prisma.person.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sector.deleteMany();
}

async function main() {
  assertSeed();
  await clear();
  const passwordHash = bcrypt.hashSync(password, 10);
  const sectorRows = await Promise.all([
    prisma.sector.create({ data: { name: "القطاع الشمالي", code: "N" } }),
    prisma.sector.create({ data: { name: "القطاع الأوسط", code: "C" } }),
    prisma.sector.create({ data: { name: "القطاع الجنوبي", code: "S" } }),
  ]);
  const sectorByCode = new Map(sectorRows.map((sector) => [sector.code, sector]));
  const staff = [
    ["admin@registry.local", "سارة الخطيب", "CENTRAL_ADMIN", null],
    ["nora.n@registry.local", "نورا حداد", "SECTOR_MANAGER", "N"],
    ["omar.c@registry.local", "عمر شاهين", "SECTOR_MANAGER", "C"],
    ["lina.s@registry.local", "لينا فهد", "SECTOR_MANAGER", "S"],
    ["fadi.n@registry.local", "فادي النجار", "REGISTRAR", "N"],
    ["hala.c@registry.local", "حلا القاسم", "REGISTRAR", "C"],
    ["sami.s@registry.local", "سامي منصور", "REGISTRAR", "S"],
    ["rami.a@registry.local", "رامي بركات", "ANALYST", null],
  ] as const;
  const users = new Map<string, { id: string }>();
  for (const [email, name, role, code] of staff) {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash,
        sectorId: code ? sectorByCode.get(code)!.id : null,
      },
    });
    users.set(email, user);
  }
  const registrar = {
    N: users.get("fadi.n@registry.local")!.id,
    C: users.get("hala.c@registry.local")!.id,
    S: users.get("sami.s@registry.local")!.id,
  };
  const issuer = {
    N: users.get("nora.n@registry.local")!.id,
    C: users.get("omar.c@registry.local")!.id,
    S: users.get("lina.s@registry.local")!.id,
  };
  const ids = new Map<string, string>();
  for (const [index, person] of people.entries()) {
    const created = await prisma.person.create({
      data: {
        nationalId: String(1900000001 + index),
        firstName: person.first,
        fatherName: person.father,
        grandfatherName: person.grand,
        familyName: person.family,
        gender: person.gender,
        birthDate: at(person.birth),
        birthPlace: hospitals[person.sector],
        lifeStatus: person.life ?? "ALIVE",
        maritalStatus: person.marital ?? "SINGLE",
        sectorId: sectorByCode.get(person.sector)!.id,
      },
    });
    ids.set(person.key, created.id);
  }
  for (const person of people) {
    if (!person.fatherKey && !person.motherKey) continue;
    await prisma.person.update({
      where: { id: ids.get(person.key)! },
      data: {
        fatherId: person.fatherKey ? ids.get(person.fatherKey) : null,
        motherId: person.motherKey ? ids.get(person.motherKey) : null,
      },
    });
  }
  const seq = new Map<string, number>();
  for (const person of people) {
    const sector = sectorByCode.get(person.sector)!;
    const year = Number(person.birth.slice(0, 4));
    const record = await prisma.birthRecord.create({
      data: {
        documentNo: take(seq, person.sector, "BIR", year),
        personId: ids.get(person.key)!,
        fatherId: person.fatherKey ? ids.get(person.fatherKey) : undefined,
        motherId: person.motherKey ? ids.get(person.motherKey) : undefined,
        eventDate: at(person.birth),
        place: hospitals[person.sector],
        sectorId: sector.id,
        registrarId: registrar[person.sector],
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: registrar[person.sector],
        sectorId: sector.id,
        entityType: "BirthRecord",
        entityId: record.id,
        action: "REGISTER_BIRTH",
        summary: `تسجيل ولادة ${person.first} ${person.family} — ${record.documentNo}`,
      },
    });
  }
  for (const person of people.filter((item) => item.death)) {
    const sector = sectorByCode.get(person.sector)!;
    const record = await prisma.deathRecord.create({
      data: {
        documentNo: take(seq, person.sector, "DTH", Number(person.death!.slice(0, 4))),
        personId: ids.get(person.key)!,
        eventDate: at(person.death!),
        place: hospitals[person.sector],
        cause: "وفاة مسجلة في البيانات التجريبية",
        sectorId: sector.id,
        registrarId: registrar[person.sector],
      },
    });
    await prisma.auditLog.create({
      data: { userId: registrar[person.sector], sectorId: sector.id, entityType: "DeathRecord", entityId: record.id, action: "REGISTER_DEATH", summary: `تسجيل وفاة ${person.first} ${person.family} — ${record.documentNo}` },
    });
  }
  const marriageIds = new Map<string, string>();
  for (const marriage of marriages) {
    const sector = sectorByCode.get(marriage.sector)!;
    const record = await prisma.marriageRecord.create({
      data: {
        documentNo: take(seq, marriage.sector, "MAR", Number(marriage.date.slice(0, 4))),
        spouse1Id: ids.get(marriage.husband)!,
        spouse2Id: ids.get(marriage.wife)!,
        eventDate: at(marriage.date),
        place: courts[marriage.sector],
        status: marriage.status,
        sectorId: sector.id,
        registrarId: registrar[marriage.sector],
        notes: marriage.key === "m-yusuf" ? "فُتح دفتر للزوج وأُلحقت به الزوجة" : undefined,
      },
    });
    marriageIds.set(marriage.key, record.id);
    await prisma.auditLog.create({
      data: { userId: registrar[marriage.sector], sectorId: sector.id, entityType: "MarriageRecord", entityId: record.id, action: "REGISTER_MARRIAGE", summary: `عقد زواج ${record.documentNo}` },
    });
  }
  const divorce = await prisma.divorceRecord.create({
    data: {
      documentNo: take(seq, "C", "DIV", 2022),
      marriageId: marriageIds.get("m-majed")!,
      eventDate: at("2022-09-15"),
      place: courts.C,
      sectorId: sectorByCode.get("C")!.id,
      registrarId: registrar.C,
      notes: "إنهاء العقد القائم بين ماجد ورنا",
    },
  });
  await prisma.auditLog.create({
    data: { userId: registrar.C, sectorId: sectorByCode.get("C")!.id, entityType: "DivorceRecord", entityId: divorce.id, action: "REGISTER_DIVORCE", summary: `تسجيل طلاق ${divorce.documentNo}` },
  });
  for (const book of books) {
    const sector = sectorByCode.get(book.sector)!;
    const created = await prisma.familyBook.create({
      data: {
        number: take(seq, book.sector, "FAM", Number(book.opened.slice(0, 4))),
        sectorId: sector.id,
        headId: ids.get(book.head)!,
        openedAt: at(book.opened),
      },
    });
    for (const [key, relation, active] of book.members) {
      await prisma.familyMember.create({
        data: { familyBookId: created.id, personId: ids.get(key)!, relation, active, joinedAt: at(book.opened) },
      });
    }
  }
  const today = new Date();
  const noCard = new Set(["jad", "leen"]);
  for (const person of people) {
    const birth = at(person.birth);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
    if (age < 16) continue;
    if ((person.life ?? "ALIVE") === "ALIVE" && noCard.has(person.key)) continue;
    const dead = (person.life ?? "ALIVE") === "DECEASED";
    const turned16 = new Date(birth.getFullYear() + 16, birth.getMonth(), birth.getDate(), 12);
    if (person.death && at(person.death) < turned16) continue;
    const sector = sectorByCode.get(person.sector)!;
    const issued = turned16;
    const card = await prisma.identityCard.create({
      data: {
        cardNo: take(seq, person.sector, "ID", issued.getFullYear()),
        personId: ids.get(person.key)!,
        issuedAt: issued,
        expiresAt: new Date(issued.getFullYear() + 10, issued.getMonth(), issued.getDate(), 12),
        status: dead ? "CANCELLED" : "ACTIVE",
        cancelReason: dead ? "DEATH" : null,
        sectorId: sector.id,
        issuerId: issuer[person.sector],
      },
    });
    await prisma.auditLog.create({
      data: { userId: issuer[person.sector], sectorId: sector.id, entityType: "IdentityCard", entityId: card.id, action: "IDENTITY", summary: `${dead ? "إلغاء" : "إصدار"} الهوية ${card.cardNo}` },
    });
  }
  console.log(`تمت تهيئة السجل: ${people.length} فردًا، كلمة المرور ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
