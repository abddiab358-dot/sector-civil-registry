import Link from "next/link";

export const controlClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/65">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="rounded-3xl border border-line bg-card px-5 py-4 shadow-sm">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gold">{hint}</p> : null}
    </article>
  );
}

export function OkBanner({ ok, no }: { ok?: string; no?: string }) {
  const text: Record<string, string> = {
    birth: "سُجّلت الولادة في السكان ودفتر العائلة",
    death: "سُجّلت الوفاة وأُلغيت الهوية السارية",
    marriage: "سُجّل العقد وحُدّث دفتر العائلة",
    divorce: "سُجّل الطلاق وأُغلق العقد",
    identity: "تم تحديث بطاقة الهوية",
    transfer: "نُقلت الإقامة، وبقيت الوثائق صادرة من قطاعها",
    place: "تم تحديث مكان الولادة",
    user: "تم حفظ الحساب",
    sector: "تم تحديث القطاع",
  };
  if (!ok || !text[ok]) return null;
  return (
    <p className="mb-4 rounded-2xl border border-good/30 bg-good/10 px-4 py-3 text-sm text-good">
      {text[ok]}
      {no ? ` — ${no}` : ""}
    </p>
  );
}

export function Pill({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "good" | "bad" | "warn" | "gold" }) {
  const tones = {
    ink: "bg-ink/10 text-ink",
    good: "bg-good/10 text-good",
    bad: "bg-bad/10 text-bad",
    warn: "bg-warn/10 text-warn",
    gold: "bg-gold/20 text-warn",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function DataTable({ columns, rows, empty }: { columns: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) {
    return <p className="rounded-3xl border border-dashed border-line bg-card px-4 py-12 text-center text-sm text-ink/55">{empty}</p>;
  }
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-right text-sm">
          <thead className="bg-ink text-paper">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-line odd:bg-white even:bg-[#faf6ef]">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PersonLink({ id, name }: { id: string; name: string }) {
  return (
    <Link href={`/persons/${id}`} className="font-medium text-teal underline-offset-4 hover:underline">
      {name}
    </Link>
  );
}

export function Pager({ page, pages, path, query }: { page: number; pages: number; path: string; query: Record<string, string | undefined> }) {
  const href = (next: number) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", String(next));
    return `${path}?${params.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink/70">
      <span>
        صفحة {page} من {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className="rounded-xl border border-line bg-card px-3 py-2">
            السابق
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} className="rounded-xl border border-line bg-card px-3 py-2">
            التالي
          </Link>
        ) : null}
      </div>
    </div>
  );
}
