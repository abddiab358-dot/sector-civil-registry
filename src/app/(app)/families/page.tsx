import Link from "next/link";
import { redirect } from "next/navigation";
import { DataTable, PageHeader, PersonLink } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { listFamilies } from "@/lib/queries";

export default async function FamiliesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const books = await listFamilies(user);
  return (
    <div>
      <PageHeader title="دفاتر العائلة" description="الدفتر يتبع قطاع إصداره. انتقال الزوجة أو فتح دفتر للزوج يُسجَّل كعضوية سابقة." />
      <DataTable
        columns={["الرقم", "رب الأسرة", "الأفراد الحاليون", "تاريخ الفتح", "القطاع"]}
        empty="لا دفاتر في هذا النطاق."
        rows={books.map((book) => [
          <Link key={book.id} href={`/families/${book.id}`} className="font-medium text-teal">
            {book.number}
          </Link>,
          <PersonLink key={`${book.id}-h`} id={book.head.id} name={`${book.head.firstName} ${book.head.familyName}`} />,
          book.members.length,
          formatDate(book.openedAt),
          book.sector.name,
        ])}
      />
    </div>
  );
}
