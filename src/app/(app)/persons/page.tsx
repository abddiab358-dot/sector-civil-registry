import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { controlClass, DataTable, OkBanner, PageHeader, Pager, PersonLink, Pill } from "@/components/ui";
import { ageYears, formatDate, formatNationalId, pageNumber } from "@/lib/format";
import { genderText, lifeText, maritalText } from "@/lib/labels";
import { isGlobal } from "@/lib/rbac";
import { listPersons, listSectors } from "@/lib/queries";

type Query = Record<string, string | string[] | undefined>;

function text(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function PersonsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const query = await searchParams;
  const q = text(query.q);
  const gender = text(query.gender);
  const life = text(query.life);
  const sectorId = text(query.sectorId);
  const page = pageNumber(text(query.page));
  const [result, sectors] = await Promise.all([
    listPersons(user, { q, page, gender, life, sectorId }),
    isGlobal(user) ? listSectors() : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader title="سجل السكان" description="كل فرد برقم وطني وقطاع إقامة واحد. البحث محصور بنطاق صلاحيتك." />
      <OkBanner ok={text(query.ok)} />
      <form className="mb-4 grid gap-2 md:grid-cols-5" action="/persons">
        <input name="q" defaultValue={q} placeholder="الاسم أو الرقم الوطني" className={controlClass} />
        <select name="gender" defaultValue={gender} className={controlClass}>
          <option value="">الجنس</option>
          <option value="MALE">ذكر</option>
          <option value="FEMALE">أنثى</option>
        </select>
        <select name="life" defaultValue={life} className={controlClass}>
          <option value="">الحالة</option>
          <option value="ALIVE">أحياء</option>
          <option value="DECEASED">متوفون</option>
        </select>
        {sectors.length > 0 ? (
          <select name="sectorId" defaultValue={sectorId} className={controlClass}>
            <option value="">كل القطاعات</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        ) : (
          <span />
        )}
        <button className="h-11 rounded-xl bg-ink text-sm text-paper">بحث</button>
      </form>
      <DataTable
        columns={["الاسم", "الرقم الوطني", "العمر", "الحالة", "القطاع"]}
        empty="لا توجد سجلات مطابقة."
        rows={result.rows.map((person) => [
          <PersonLink key={person.id} id={person.id} name={`${person.firstName} ${person.fatherName} ${person.familyName}`} />,
          <span key={`${person.id}-id`} className="font-mono text-xs">{formatNationalId(person.nationalId)}</span>,
          ageYears(person.birthDate, new Date()),
          <span key={`${person.id}-s`} className="flex gap-1">
            <Pill tone={person.lifeStatus === "ALIVE" ? "good" : "bad"}>{lifeText(person.lifeStatus, person.gender)}</Pill>
            <Pill>{maritalText(person.maritalStatus, person.gender)}</Pill>
            <span className="sr-only">{genderText(person.gender)}</span>
          </span>,
          person.sector.name,
        ])}
      />
      <Pager page={result.page} pages={result.pages} path="/persons" query={{ q, gender, life, sectorId }} />
    </div>
  );
}
