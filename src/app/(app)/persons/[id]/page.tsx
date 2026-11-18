import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlaceForm, TransferForm } from "@/components/forms";
import { DataTable, OkBanner, PageHeader, PersonLink, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { ageYears, formatDate, formatNationalId } from "@/lib/format";
import { cancelReasonText, cardStatusText, genderText, lifeText, maritalText, marriageStatusText, relationText } from "@/lib/labels";
import { canIssueIdentity, canWrite, isGlobal } from "@/lib/rbac";
import { getPerson, listSectors } from "@/lib/queries";

type Query = Record<string, string | string[] | undefined>;

export default async function PersonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const query = await searchParams;
  const person = await getPerson(user, id);
  if (!person) notFound();
  const sectors = user.role === "CENTRAL_ADMIN" ? await listSectors() : [];
  const children = [...person.paternalChildren, ...person.maternalChildren];
  const marriages = [
    ...person.marriagesAsHusband.map((marriage) => ({ marriage, spouse: marriage.spouse2 })),
    ...person.marriagesAsWife.map((marriage) => ({ marriage, spouse: marriage.spouse1 })),
  ];
  const ok = typeof query.ok === "string" ? query.ok : "";
  const no = typeof query.no === "string" ? query.no : "";

  return (
    <div>
      <PageHeader
        title={`${person.firstName} ${person.fatherName} ${person.grandfatherName} ${person.familyName}`}
        description={`${formatNationalId(person.nationalId)} · ${person.sector.name}`}
        action={
          <div className="flex gap-2">
            <Pill tone={person.lifeStatus === "ALIVE" ? "good" : "bad"}>{lifeText(person.lifeStatus, person.gender)}</Pill>
            <Pill>{maritalText(person.maritalStatus, person.gender)}</Pill>
            <Pill tone="gold">{genderText(person.gender)}</Pill>
          </div>
        }
      />
      <OkBanner ok={ok} no={no} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Info label="تاريخ الولادة" value={`${formatDate(person.birthDate)} · ${ageYears(person.birthDate, new Date())} عامًا`} />
        <Info label="مكان الولادة" value={person.birthPlace} />
        <Info label="الأب" value={person.father ? <PersonLink id={person.father.id} name={person.father.firstName + " " + person.father.familyName} /> : "غير مسجّل"} />
        <Info label="الأم" value={person.mother ? <PersonLink id={person.mother.id} name={person.mother.firstName + " " + person.mother.familyName} /> : "غير مسجّلة"} />
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {canWrite(user) ? <PlaceForm personId={person.id} initial={person.birthPlace} /> : null}
        {user.role === "CENTRAL_ADMIN" ? <TransferForm sectors={sectors} personId={person.id} /> : null}
      </div>
      <section className="mb-6">
        <h2 className="mb-3 font-semibold">دفاتر العائلة</h2>
        <DataTable
          columns={["الدفتر", "الصلة", "الوضع", "قطاع الدفتر"]}
          empty="لا عضوية مسجّلة."
          rows={person.memberships.map((member) => [
            isGlobal(user) || member.familyBook.sectorId === user.sectorId ? (
              <Link key={member.id} href={`/families/${member.familyBookId}`} className="text-teal">
                {member.familyBook.number}
              </Link>
            ) : (
              member.familyBook.number
            ),
            relationText(member.relation, person.gender),
            member.active ? "حالية" : "سابقة",
            member.familyBook.sector.name,
          ])}
        />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 font-semibold">الأبناء</h2>
        <DataTable
          columns={["الاسم", "تاريخ الولادة"]}
          empty="لا أبناء مسجّلين."
          rows={children.map((child) => [
            <PersonLink key={child.id} id={child.id} name={`${child.firstName} ${child.familyName}`} />,
            formatDate(child.birthDate),
          ])}
        />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 font-semibold">الزواج والطلاق</h2>
        <DataTable
          columns={["الوثيقة", "الطرف الآخر", "التاريخ", "الحالة"]}
          empty="لا عقود."
          rows={marriages.map(({ marriage, spouse }) => [
            marriage.documentNo,
            <PersonLink key={spouse.id} id={spouse.id} name={`${spouse.firstName} ${spouse.familyName}`} />,
            formatDate(marriage.eventDate),
            marriageStatusText(marriage.status),
          ])}
        />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 font-semibold">الهوية</h2>
        {canIssueIdentity(user) ? (
          <p className="mb-2 text-sm text-ink/60">
            الإصدار والتجديد من صفحة <Link href="/identities" className="text-teal">الهويات</Link>.
          </p>
        ) : null}
        <DataTable
          columns={["الرقم", "الإصدار", "الانتهاء", "الحالة", "سبب الإلغاء"]}
          empty="لا بطاقة صادرة."
          rows={person.identityCards.map((card) => [
            card.cardNo,
            formatDate(card.issuedAt),
            formatDate(card.expiresAt),
            <Pill key={card.id} tone={card.status === "ACTIVE" ? "good" : "bad"}>{cardStatusText(card.status)}</Pill>,
            cancelReasonText(card.cancelReason),
          ])}
        />
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        <Info label="شهادة الولادة" value={person.birthRecord ? `${person.birthRecord.documentNo} · ${formatDate(person.birthRecord.eventDate)}` : "غير مرتبطة"} />
        <Info label="شهادة الوفاة" value={person.deathRecord ? `${person.deathRecord.documentNo} · ${formatDate(person.deathRecord.eventDate)}` : "—"} />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-card px-4 py-3">
      <p className="text-xs text-ink/55">{label}</p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
