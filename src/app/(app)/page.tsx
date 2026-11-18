import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { DashboardCharts } from "@/components/charts";
import { PageHeader, Stat } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { roleLabel } from "@/lib/labels";
import { getDashboard } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await getDashboard(user);

  return (
    <div>
      <PageHeader
        title={`أهلًا ${user.name}`}
        description={`${roleLabel[user.role]}. الأرقام محسوبة من السجلات الحية لسنة ${data.year}، وليست جدولًا منفصلًا.`}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="السكان الأحياء" value={formatNumber(data.living)} />
        <Stat label="ولادات هذا العام" value={formatNumber(data.birthsThisYear)} />
        <Stat label="وفيات هذا العام" value={formatNumber(data.deathsThisYear)} />
        <Stat label="زيجات هذا العام" value={formatNumber(data.marriagesThisYear)} hint={`${formatNumber(data.divorcesThisYear)} حالة طلاق`} />
      </div>
      <DashboardCharts sectors={data.sectors} series={data.series} pyramid={data.pyramid} />
      <section className="mt-4 rounded-3xl border border-line bg-card p-5">
        <h2 className="mb-3 font-semibold">آخر الوقائع</h2>
        <ul className="divide-y divide-line">
          {data.recent.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                <span className="text-gold">{item.kind}</span> · {item.title}
              </span>
              <Link href={item.href} className="text-teal">
                {item.meta}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
