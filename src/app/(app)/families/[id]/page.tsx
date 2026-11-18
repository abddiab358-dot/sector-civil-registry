import { notFound, redirect } from "next/navigation";
import { DataTable, PageHeader, PersonLink, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { relationText } from "@/lib/labels";
import { sectorWhere } from "@/lib/rbac";
import { getFamily } from "@/lib/queries";

export default async function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const book = await getFamily(user, id);
  if (!book) notFound();
  const scope = sectorWhere(user);
  const visible = (sectorId: string) => !("sectorId" in scope) || scope.sectorId === sectorId;
  const active = book.members.filter((member) => member.active);
  const previous = book.members.filter((member) => !member.active);

  return (
    <div>
      <PageHeader title={book.number} description={`${book.sector.name} · فُتح ${formatDate(book.openedAt)} · رب الأسرة ${book.head.firstName} ${book.head.familyName}`} />
      <h2 className="mb-3 font-semibold">الأعضاء الحاليون</h2>
      <MemberTable members={active} canOpen={visible} />
      <h2 className="mb-3 mt-8 font-semibold">عضويات سابقة</h2>
      <MemberTable members={previous} canOpen={visible} />
    </div>
  );
}

function MemberTable({
  members,
  canOpen,
}: {
  members: {
    id: string;
    relation: string;
    joinedAt: Date;
    person: { id: string; firstName: string; fatherName: string; familyName: string; gender: string; sectorId: string; sector: { name: string } };
  }[];
  canOpen: (sectorId: string) => boolean;
}) {
  return (
    <DataTable
      columns={["الاسم", "الصلة", "إقامة حالية", "تاريخ القيد"]}
      empty="لا سجلات."
      rows={members.map((member) => [
        canOpen(member.person.sectorId) ? (
          <PersonLink key={member.id} id={member.person.id} name={`${member.person.firstName} ${member.person.fatherName} ${member.person.familyName}`} />
        ) : (
          <span key={member.id}>
            {member.person.firstName} {member.person.familyName} <Pill>خارج النطاق</Pill>
          </span>
        ),
        relationText(member.relation, member.person.gender),
        member.person.sector.name,
        formatDate(member.joinedAt),
      ])}
    />
  );
}
