import { redirect } from "next/navigation";
import { UserActiveButton, UserForm } from "@/components/forms";
import { DataTable, OkBanner, PageHeader, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { roleLabel } from "@/lib/labels";
import { canManageUsers, isGlobal } from "@/lib/rbac";
import { listSectors, listUsers } from "@/lib/queries";
import type { Role } from "@/lib/types";

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user || !canManageUsers(user)) redirect("/");
  const query = await searchParams;
  const [users, sectors] = await Promise.all([listUsers(user), isGlobal(user) ? listSectors() : Promise.resolve([])]);
  const roles =
    user.role === "CENTRAL_ADMIN"
      ? (["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] as Role[]).map((role) => ({ value: role, label: roleLabel[role] }))
      : (["REGISTRAR", "ANALYST"] as Role[]).map((role) => ({ value: role, label: roleLabel[role] }));

  return (
    <div>
      <PageHeader title="المستخدمون" description="مدير القطاع ينشئ موظفي سجله ومحلليه فقط. الإدارة المركزية تدير كل الحسابات." />
      <OkBanner ok={typeof query.ok === "string" ? query.ok : ""} />
      <UserForm sectors={sectors.map((sector) => ({ id: sector.id, name: sector.name }))} roles={roles} />
      <DataTable
        columns={["الاسم", "البريد", "الدور", "القطاع", "الحالة", ""]}
        empty="لا حسابات."
        rows={users.map((row) => [
          row.name,
          row.email,
          roleLabel[row.role as Role] ?? row.role,
          row.sector?.name ?? "كل القطاعات",
          <Pill key={row.id} tone={row.active ? "good" : "bad"}>{row.active ? "نشط" : "موقوف"}</Pill>,
          row.id === user.id ? "—" : <UserActiveButton key={`${row.id}-a`} id={row.id} active={row.active} />,
        ])}
      />
    </div>
  );
}
