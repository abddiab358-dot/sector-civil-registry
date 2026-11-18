import { roleLabel } from "@/lib/labels";
import type { SessionUser } from "@/lib/types";
import { SideNav } from "./nav";
import { Seal } from "./seal";

export function Shell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const scope = user.sectorName ?? "كل القطاعات";
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="flex flex-col border-b border-gold/40 bg-ink text-paper lg:min-h-screen lg:border-b-0 lg:border-l print:hidden">
        <div className="flex items-center gap-3 px-5 py-5">
          <Seal className="h-12 w-12 text-gold" />
          <div>
            <p className="text-base font-semibold">السجل المدني</p>
            <p className="text-xs text-paper/60">إحصاء · تسجيل · وثائق</p>
          </div>
        </div>
        <SideNav role={user.role} />
        <div className="mt-auto border-t border-white/10 px-5 py-4">
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-paper/65">
            {roleLabel[user.role]} · {scope}
          </p>
          <form action="/api/auth/logout" method="post" className="mt-3">
            <button className="text-sm text-gold">تسجيل الخروج</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-line bg-card/80 px-5 py-3 text-sm print:hidden">
          <span>نطاق العرض: {scope}</span>
          <span className="text-ink/60">ثلاثة قطاعات تحت إدارة مركزية</span>
        </div>
        <div className="px-4 py-6 md:px-8 md:py-8">{children}</div>
      </div>
    </div>
  );
}
