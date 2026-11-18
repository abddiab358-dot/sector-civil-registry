import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import { AppError } from "./errors";
import type { SessionUser } from "./types";

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("يلزم تسجيل الدخول", 401);
  return user;
}

export async function handle(action: () => Promise<unknown>) {
  try {
    return NextResponse.json(await action());
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
