import { redirect } from "next/navigation";
import { DeathForm } from "@/components/forms";
import { DataTable, PageHeader, PersonLink } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, fullName } from "@/lib/format";
import { canWrite } from "@/lib/rbac";
import { listDeaths } from "@/lib/queries";

export default async function DeathsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rows = await listDeaths(user);
  return (
    <div>
      <PageHeader title="الوفيات" description="الوفاة تلغي الهوية السارية، وتُحوّل الزوج الحي إلى أرمل أو أرملة." />
      {canWrite(user) ? <DeathForm /> : null}
      <DataTable
        columns={["الوثيقة", "المتوفى", "التاريخ", "المكان", "القطاع"]}
        empty="لا شهادات وفاة."
        rows={rows.map((row) => [row.documentNo, <PersonLink key={row.id} id={row.personId} name={fullName(row.person)} />, formatDate(row.eventDate), row.place, row.sector.name])}
      />
    </div>
  );
}
