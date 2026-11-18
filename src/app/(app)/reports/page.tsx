import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardCharts } from "@/components/charts";
import { PrintButton } from "@/components/print-button";
import { DataTable, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { getDashboard } from "@/lib/queries";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboard(user);
  return (
    <div>
      <PageHeader
        title="التقارير"
        description="المعدلات لكل ألف من السكان الأحياء في السنة الجارية، محسوبة من الوقائع المسجّلة."
        action={
          <div className="flex gap-2 print:hidden">
            <Link href="/api/reports/export?kind=population" className="rounded-xl border border-line bg-card px-4 py-2 text-sm">
              تصدير السكان
            </Link>
            <Link href="/api/reports/export?kind=events" className="rounded-xl bg-ink px-4 py-2 text-sm text-paper">
              تصدير الوقائع
            </Link>
            <PrintButton />
          </div>
        }
      />
      <div className="mb-4">
        <DataTable
          columns={["القطاع", "الأحياء", "ولادات", "وفيات", "معدل الولادة", "معدل الوفاة"]}
          empty="لا بيانات."
          rows={data.sectors.map((sector) => [
            sector.name,
            formatNumber(sector.living),
            formatNumber(sector.births),
            formatNumber(sector.deaths),
            sector.birthRate,
            sector.deathRate,
          ])}
        />
      </div>
      <DashboardCharts sectors={data.sectors} series={data.series} pyramid={data.pyramid} />
    </div>
  );
}
