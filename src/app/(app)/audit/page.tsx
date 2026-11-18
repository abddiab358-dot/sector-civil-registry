import { redirect } from "next/navigation";
import { DataTable, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { listAudit } from "@/lib/queries";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rows = await listAudit(user);
  return (
    <div>
      <PageHeader title="سجل التدقيق" description="كل تسجيل أو تعديل أو نقل يظهر هنا ضمن نطاق صلاحيتك." />
      <DataTable
        columns={["الوقت", "المستخدم", "الإجراء", "الملخص", "القطاع"]}
        empty="لا حركات."
        rows={rows.map((row) => [formatDate(row.createdAt), row.user.name, row.action, row.summary, row.sector?.name ?? "مركزي"])}
      />
    </div>
  );
}
