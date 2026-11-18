import { redirect } from "next/navigation";
import { MarriageForm } from "@/components/forms";
import { DataTable, OkBanner, PageHeader, PersonLink, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, fullName } from "@/lib/format";
import { marriageStatusText } from "@/lib/labels";
import { canWrite, isGlobal } from "@/lib/rbac";
import { listMarriages, listSectors } from "@/lib/queries";

export default async function MarriagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const query = await searchParams;
  const [rows, sectors] = await Promise.all([listMarriages(user), isGlobal(user) ? listSectors() : Promise.resolve([])]);
  return (
    <div>
      <PageHeader title="الزواج" description="طرفان بالغان على قيد الحياة، من غير المحارم المسجّلين. الزوجة تُنقل إلى دفتر الزوج أو يُفتح دفتر جديد." />
      <OkBanner ok={typeof query.ok === "string" ? query.ok : ""} no={typeof query.no === "string" ? query.no : ""} />
      {canWrite(user) ? <MarriageForm sectors={sectors.map((sector) => ({ id: sector.id, name: sector.name }))} /> : null}
      <DataTable
        columns={["الوثيقة", "الزوج", "الزوجة", "التاريخ", "الحالة", "القطاع"]}
        empty="لا عقود."
        rows={rows.map((row) => [
          row.documentNo,
          <PersonLink key={`${row.id}-h`} id={row.spouse1Id} name={fullName(row.spouse1)} />,
          <PersonLink key={`${row.id}-w`} id={row.spouse2Id} name={fullName(row.spouse2)} />,
          formatDate(row.eventDate),
          <Pill key={`${row.id}-s`} tone={row.status === "ACTIVE" ? "good" : "warn"}>{marriageStatusText(row.status)}</Pill>,
          row.sector.name,
        ])}
      />
    </div>
  );
}
