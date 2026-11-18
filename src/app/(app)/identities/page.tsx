import { redirect } from "next/navigation";
import { IdentityForm } from "@/components/forms";
import { DataTable, PageHeader, PersonLink, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, fullName } from "@/lib/format";
import { cancelReasonText, cardStatusText } from "@/lib/labels";
import { canIssueIdentity } from "@/lib/rbac";
import { listIdentities } from "@/lib/queries";

export default async function IdentitiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rows = await listIdentities(user);
  return (
    <div>
      <PageHeader title="بطاقات الهوية" description="تصدر للأحياء فقط. التجديد يلغي البطاقة السابقة، والوفاة تلغي السارية." />
      {canIssueIdentity(user) ? <IdentityForm /> : null}
      <DataTable
        columns={["الرقم", "صاحبها", "الإصدار", "الانتهاء", "الحالة", "الإلغاء"]}
        empty="لا بطاقات."
        rows={rows.map((row) => [
          row.cardNo,
          <PersonLink key={row.id} id={row.personId} name={fullName(row.person)} />,
          formatDate(row.issuedAt),
          formatDate(row.expiresAt),
          <Pill key={`${row.id}-s`} tone={row.status === "ACTIVE" ? "good" : "bad"}>{cardStatusText(row.status)}</Pill>,
          cancelReasonText(row.cancelReason),
        ])}
      />
    </div>
  );
}
