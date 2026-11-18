import { redirect } from "next/navigation";
import { SectorEditor } from "@/components/forms";
import { OkBanner, PageHeader, Pill } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { listSectors } from "@/lib/queries";

export default async function SectorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CENTRAL_ADMIN") redirect("/");
  const query = await searchParams;
  const sectors = await listSectors();
  return (
    <div>
      <PageHeader title="القطاعات" description="إيقاف القطاع يمنع المعاملات الجديدة ولا يخفي السجلات التاريخية." />
      <OkBanner ok={typeof query.ok === "string" ? query.ok : ""} />
      <div className="grid gap-4 lg:grid-cols-3">
        {sectors.map((sector) => (
          <section key={sector.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{sector.code}</h2>
              <Pill tone={sector.active ? "good" : "bad"}>{sector.active ? "نشط" : "موقوف"}</Pill>
            </div>
            <SectorEditor sector={{ id: sector.id, name: sector.name, active: sector.active }} />
          </section>
        ))}
      </div>
    </div>
  );
}
