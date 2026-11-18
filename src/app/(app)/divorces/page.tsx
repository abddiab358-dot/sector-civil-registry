import { redirect } from "next/navigation";
import { DivorceForm } from "@/components/forms";
import { DataTable, OkBanner, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, fullName } from "@/lib/format";
import { canWrite } from "@/lib/rbac";
import { listActiveMarriages, listDivorces } from "@/lib/queries";

export default async function DivorcesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const query = await searchParams;
  const [rows, active] = await Promise.all([listDivorces(user), canWrite(user) ? listActiveMarriages(user) : Promise.resolve([])]);
  return (
    <div>
      <PageHeader title="الطلاق" description="يُقبل فقط على عقد قائم بين زوجين أحياء، ولا يُكرَّر على العقد نفسه." />
      <OkBanner ok={typeof query.ok === "string" ? query.ok : ""} no={typeof query.no === "string" ? query.no : ""} />
      {canWrite(user) ? (
        <DivorceForm
          marriages={active.map((marriage) => ({
            id: marriage.id,
            label: `${marriage.documentNo} · ${fullName(marriage.spouse1)} / ${fullName(marriage.spouse2)}`,
          }))}
        />
      ) : null}
      <DataTable
        columns={["وثيقة الطلاق", "عقد الزواج", "الزوجان", "التاريخ", "القطاع"]}
        empty="لا سجلات طلاق."
        rows={rows.map((row) => [
          row.documentNo,
          row.marriage.documentNo,
          `${fullName(row.marriage.spouse1)} / ${fullName(row.marriage.spouse2)}`,
          formatDate(row.eventDate),
          row.sector.name,
        ])}
      />
    </div>
  );
}
