import type { Prisma } from "@prisma/client";
import { ageYears } from "./format";
import { prisma } from "./prisma";
import { isGlobal, sectorWhere } from "./rbac";
import type { SessionUser } from "./types";

const personListSelect = {
  id: true,
  nationalId: true,
  firstName: true,
  fatherName: true,
  grandfatherName: true,
  familyName: true,
  gender: true,
  birthDate: true,
  lifeStatus: true,
  maritalStatus: true,
  sector: { select: { id: true, name: true, code: true } },
} as const;

const bands = [
  { label: "0-4", min: 0, max: 4 },
  { label: "5-14", min: 5, max: 14 },
  { label: "15-24", min: 15, max: 24 },
  { label: "25-34", min: 25, max: 34 },
  { label: "35-44", min: 35, max: 44 },
  { label: "45-59", min: 45, max: 59 },
  { label: "60+", min: 60, max: 200 },
];

function inYear(date: Date, year: number) {
  return date.getFullYear() === year;
}

export async function listSectors() {
  return prisma.sector.findMany({ orderBy: { code: "asc" } });
}

export async function searchPersons(
  user: SessionUser,
  filters: { q?: string; gender?: string; alive?: string; unmarried?: string; adult?: string },
) {
  const q = filters.q?.trim() ?? "";
  if (q.length < 2) return [];
  const where: Prisma.PersonWhereInput = {
    ...sectorWhere(user),
    OR: [
      { nationalId: { contains: q } },
      { firstName: { contains: q } },
      { fatherName: { contains: q } },
      { familyName: { contains: q } },
    ],
  };
  if (filters.gender === "MALE" || filters.gender === "FEMALE") where.gender = filters.gender;
  if (filters.alive === "1") where.lifeStatus = "ALIVE";
  if (filters.unmarried === "1") where.maritalStatus = { not: "MARRIED" };
  if (filters.adult === "1") {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    where.birthDate = { lte: cutoff };
  }
  return prisma.person.findMany({
    where,
    select: personListSelect,
    orderBy: [{ familyName: "asc" }, { firstName: "asc" }],
    take: 8,
  });
}

export async function listPersons(
  user: SessionUser,
  filters: { q?: string; page: number; gender?: string; life?: string; sectorId?: string },
) {
  const q = filters.q?.trim();
  const where: Prisma.PersonWhereInput = { ...sectorWhere(user) };
  if (isGlobal(user) && filters.sectorId) where.sectorId = filters.sectorId;
  if (filters.gender === "MALE" || filters.gender === "FEMALE") where.gender = filters.gender;
  if (filters.life === "ALIVE" || filters.life === "DECEASED") where.lifeStatus = filters.life;
  if (q) {
    where.OR = [
      { nationalId: { contains: q } },
      { firstName: { contains: q } },
      { fatherName: { contains: q } },
      { familyName: { contains: q } },
    ];
  }
  const take = 12;
  const skip = (filters.page - 1) * take;
  const [total, rows] = await Promise.all([
    prisma.person.count({ where }),
    prisma.person.findMany({
      where,
      select: personListSelect,
      orderBy: [{ familyName: "asc" }, { firstName: "asc" }],
      skip,
      take,
    }),
  ]);
  return { total, rows, page: filters.page, pages: Math.max(1, Math.ceil(total / take)) };
}

export async function getPerson(user: SessionUser, id: string) {
  return prisma.person.findFirst({
    where: { id, ...sectorWhere(user) },
    include: {
      sector: true,
      father: true,
      mother: true,
      paternalChildren: true,
      maternalChildren: true,
      birthRecord: true,
      deathRecord: true,
      identityCards: { orderBy: { issuedAt: "desc" } },
      marriagesAsHusband: { include: { spouse2: true, divorce: true } },
      marriagesAsWife: { include: { spouse1: true, divorce: true } },
      memberships: { include: { familyBook: { include: { sector: true } } }, orderBy: { joinedAt: "desc" } },
    },
  });
}

export async function listFamilies(user: SessionUser) {
  return prisma.familyBook.findMany({
    where: sectorWhere(user),
    include: {
      head: true,
      sector: true,
      members: { where: { active: true }, select: { id: true } },
    },
    orderBy: { number: "asc" },
  });
}

export async function getFamily(user: SessionUser, id: string) {
  return prisma.familyBook.findFirst({
    where: { id, ...sectorWhere(user) },
    include: {
      head: true,
      sector: true,
      members: { include: { person: { include: { sector: true } } }, orderBy: [{ active: "desc" }, { joinedAt: "asc" }] },
    },
  });
}

export async function listBirths(user: SessionUser) {
  return prisma.birthRecord.findMany({
    where: sectorWhere(user),
    include: { person: true, father: true, mother: true, sector: true },
    orderBy: { eventDate: "desc" },
    take: 40,
  });
}

export async function listDeaths(user: SessionUser) {
  return prisma.deathRecord.findMany({
    where: sectorWhere(user),
    include: { person: true, sector: true },
    orderBy: { eventDate: "desc" },
    take: 40,
  });
}

export async function listMarriages(user: SessionUser) {
  return prisma.marriageRecord.findMany({
    where: sectorWhere(user),
    include: { spouse1: true, spouse2: true, sector: true, divorce: true },
    orderBy: { eventDate: "desc" },
    take: 40,
  });
}

export async function listActiveMarriages(user: SessionUser) {
  return prisma.marriageRecord.findMany({
    where: { ...sectorWhere(user), status: "ACTIVE" },
    include: { spouse1: true, spouse2: true },
    orderBy: { eventDate: "desc" },
  });
}

export async function listDivorces(user: SessionUser) {
  return prisma.divorceRecord.findMany({
    where: sectorWhere(user),
    include: { marriage: { include: { spouse1: true, spouse2: true } }, sector: true },
    orderBy: { eventDate: "desc" },
    take: 40,
  });
}

export async function listIdentities(user: SessionUser) {
  return prisma.identityCard.findMany({
    where: sectorWhere(user),
    include: { person: true, sector: true },
    orderBy: { issuedAt: "desc" },
    take: 50,
  });
}

export async function listUsers(user: SessionUser) {
  return prisma.user.findMany({
    where: isGlobal(user) ? {} : { sectorId: user.sectorId ?? "___none___" },
    include: { sector: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function listAudit(user: SessionUser) {
  return prisma.auditLog.findMany({
    where: isGlobal(user) ? {} : { sectorId: user.sectorId ?? "___none___" },
    include: { user: true, sector: true },
    orderBy: { createdAt: "desc" },
    take: 150,
  });
}

export async function getDashboard(user: SessionUser) {
  const scope = sectorWhere(user);
  const now = new Date();
  const year = now.getFullYear();
  const sectors = await prisma.sector.findMany({
    where: isGlobal(user) ? {} : { id: user.sectorId ?? "___none___" },
    orderBy: { code: "asc" },
  });
  const [people, births, deaths, marriages, divorces] = await Promise.all([
    prisma.person.findMany({ where: scope, select: { birthDate: true, gender: true, lifeStatus: true, sectorId: true } }),
    prisma.birthRecord.findMany({ where: scope, select: { eventDate: true, sectorId: true, id: true, documentNo: true, person: { select: { firstName: true, familyName: true } } }, orderBy: { eventDate: "desc" } }),
    prisma.deathRecord.findMany({ where: scope, select: { eventDate: true, sectorId: true, id: true, documentNo: true, person: { select: { firstName: true, familyName: true } } }, orderBy: { eventDate: "desc" } }),
    prisma.marriageRecord.findMany({ where: scope, select: { eventDate: true, sectorId: true, id: true, documentNo: true }, orderBy: { eventDate: "desc" } }),
    prisma.divorceRecord.findMany({ where: scope, select: { eventDate: true, sectorId: true, id: true, documentNo: true }, orderBy: { eventDate: "desc" } }),
  ]);
  const livingPeople = people.filter((person) => person.lifeStatus === "ALIVE");
  const pyramid = bands.map((band) => ({
    band: band.label,
    male: livingPeople.filter((person) => person.gender === "MALE" && inBand(person.birthDate, band.min, band.max)).length,
    female: livingPeople.filter((person) => person.gender === "FEMALE" && inBand(person.birthDate, band.min, band.max)).length,
  }));
  const series = Array.from({ length: 8 }, (_, index) => year - 7 + index).map((point) => ({
    year: String(point),
    births: births.filter((row) => inYear(row.eventDate, point)).length,
    deaths: deaths.filter((row) => inYear(row.eventDate, point)).length,
    marriages: marriages.filter((row) => inYear(row.eventDate, point)).length,
    divorces: divorces.filter((row) => inYear(row.eventDate, point)).length,
  }));
  const sectorRows = sectors.map((sector) => {
    const living = livingPeople.filter((person) => person.sectorId === sector.id).length;
    const birthsYear = births.filter((row) => row.sectorId === sector.id && inYear(row.eventDate, year)).length;
    const deathsYear = deaths.filter((row) => row.sectorId === sector.id && inYear(row.eventDate, year)).length;
    return {
      name: sector.name,
      code: sector.code,
      living,
      births: birthsYear,
      deaths: deathsYear,
      birthRate: living ? Math.round((birthsYear / living) * 10000) / 10 : 0,
      deathRate: living ? Math.round((deathsYear / living) * 10000) / 10 : 0,
    };
  });
  const recent = [
    ...births.slice(0, 4).map((row) => ({ id: row.id, kind: "ولادة", title: `${row.person.firstName} ${row.person.familyName}`, meta: row.documentNo, href: "/births" })),
    ...deaths.slice(0, 3).map((row) => ({ id: row.id, kind: "وفاة", title: `${row.person.firstName} ${row.person.familyName}`, meta: row.documentNo, href: "/deaths" })),
    ...marriages.slice(0, 3).map((row) => ({ id: row.id, kind: "زواج", title: row.documentNo, meta: row.documentNo, href: "/marriages" })),
  ].slice(0, 8);
  return {
    living: livingPeople.length,
    birthsThisYear: births.filter((row) => inYear(row.eventDate, year)).length,
    deathsThisYear: deaths.filter((row) => inYear(row.eventDate, year)).length,
    marriagesThisYear: marriages.filter((row) => inYear(row.eventDate, year)).length,
    divorcesThisYear: divorces.filter((row) => inYear(row.eventDate, year)).length,
    year,
    sectors: sectorRows,
    series,
    pyramid,
    recent,
  };
}

function inBand(birth: Date, min: number, max: number) {
  const age = ageYears(birth, new Date());
  return age >= min && age <= max;
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function populationCsv(user: SessionUser) {
  const people = await prisma.person.findMany({
    where: sectorWhere(user),
    include: { sector: true },
    orderBy: [{ familyName: "asc" }, { firstName: "asc" }],
  });
  const rows = [
    ["الرقم الوطني", "الاسم", "اسم الأب", "اسم الجد", "العائلة", "الجنس", "تاريخ الولادة", "الحالة", "الحالة الاجتماعية", "القطاع"],
    ...people.map((person) => [
      person.nationalId,
      person.firstName,
      person.fatherName,
      person.grandfatherName,
      person.familyName,
      person.gender,
      person.birthDate.toISOString().slice(0, 10),
      person.lifeStatus,
      person.maritalStatus,
      person.sector.name,
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`;
}

export async function eventsCsv(user: SessionUser) {
  const scope = sectorWhere(user);
  const [births, deaths, marriages, divorces] = await Promise.all([
    prisma.birthRecord.findMany({ where: scope, include: { sector: true, person: true } }),
    prisma.deathRecord.findMany({ where: scope, include: { sector: true, person: true } }),
    prisma.marriageRecord.findMany({ where: scope, include: { sector: true } }),
    prisma.divorceRecord.findMany({ where: scope, include: { sector: true } }),
  ]);
  const rows = [
    ["النوع", "رقم الوثيقة", "التاريخ", "القطاع", "بيان"],
    ...births.map((row) => ["ولادة", row.documentNo, row.eventDate.toISOString().slice(0, 10), row.sector.name, row.person.nationalId]),
    ...deaths.map((row) => ["وفاة", row.documentNo, row.eventDate.toISOString().slice(0, 10), row.sector.name, row.person.nationalId]),
    ...marriages.map((row) => ["زواج", row.documentNo, row.eventDate.toISOString().slice(0, 10), row.sector.name, row.status]),
    ...divorces.map((row) => ["طلاق", row.documentNo, row.eventDate.toISOString().slice(0, 10), row.sector.name, ""]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`;
}
