import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { eventsCsv, populationCsv } from "@/lib/queries";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "يلزم تسجيل الدخول" }, { status: 401 });
  const kind = new URL(request.url).searchParams.get("kind");
  const csv = kind === "events" ? await eventsCsv(user) : await populationCsv(user);
  const filename = kind === "events" ? "events.csv" : "population.csv";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
