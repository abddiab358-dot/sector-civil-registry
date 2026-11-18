import { redirect } from "next/navigation";
import { BirthForm } from "@/components/forms";
import { DataTable, OkBanner, PageHeader, PersonLink } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { fullName } from "@/lib/format";
import { canWrite, isGlobal } from "@/lib/rbac";
import { listBirths, listSectors } from "@/lib/queries";

export default async function BirthsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const query = await searchParams;
  const [rows, sectors] = await Promise.all([listBirths(user), isGlobal(user) ? listSectors() : Promise.resolve([])]);
  return (
    <div>
      <PageHeader title="الولادات" description="التسجيل ينشئ فردًا ورقمًا وطنيًا وشهادة، ويضيف المولود إلى دفتر الأب." />
      <OkBanner ok={typeof query.ok === "string" ? query.ok : ""} no={typeof query.no === "string" ? query.no : ""} />
      {canWrite(user) ? <BirthForm sectors={sectors.map((sector) => ({ id: sector.id, name: sector.name }))} /> : null}
      <DataTable
        columns={["الوثيقة", "المولود", "الأب", "الأم", "التاريخ", "القطاع"]}
        empty="لا شهادات."
        rows={rows.map((row) => [
          row.documentNo,
          <PersonLink key={row.id} id={row.personId} name={fullName(row.person)} />,
          row.father ? <PersonLink key={`${row.id}-f`} id={row.father.id} name={fullName(row.father)} /> : "—",
          row.mother ? <PersonLink key={`${row.id}-m`} id={row.mother.id} name={fullName(row.mother)} /> : "—",
          formatDate(row.eventDate),
          row.sector.name,
        ])}
      />
    </div>
  );
}
