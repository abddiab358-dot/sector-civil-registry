"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type SectorRow = { name: string; living: number; births: number; deaths: number };
type YearPoint = { year: string; births: number; deaths: number; marriages: number; divorces: number };
type Band = { band: string; male: number; female: number };

export function DashboardCharts({ sectors, series, pyramid }: { sectors: SectorRow[]; series: YearPoint[]; pyramid: Band[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="السكان الأحياء حسب القطاع">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sectors}>
            <CartesianGrid stroke="#e4d9c8" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#14233a", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#14233a", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="living" name="أحياء" fill="#0f6e62" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="الوقائع خلال ثماني سنوات">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series}>
            <CartesianGrid stroke="#e4d9c8" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: "#14233a", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#14233a", fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line dataKey="births" name="ولادات" stroke="#0f6e62" strokeWidth={2} dot={false} />
            <Line dataKey="deaths" name="وفيات" stroke="#8d2e2e" strokeWidth={2} dot={false} />
            <Line dataKey="marriages" name="زيجات" stroke="#14233a" strokeWidth={2} dot={false} />
            <Line dataKey="divorces" name="طلاق" stroke="#b6894a" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="الهرم العمري للأحياء">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={pyramid}>
            <CartesianGrid stroke="#e4d9c8" vertical={false} />
            <XAxis dataKey="band" tick={{ fill: "#14233a", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#14233a", fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="male" name="ذكور" fill="#1d4e89" radius={4} />
            <Bar dataKey="female" name="إناث" fill="#b6894a" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-card p-4 shadow-sm xl:last:col-span-2">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div dir="ltr" className="h-[280px]">
        {children}
      </div>
    </section>
  );
}
