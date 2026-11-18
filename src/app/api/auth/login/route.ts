import bcrypt from "bcryptjs";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { handle } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().email("البريد غير صالح"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

export async function POST(request: Request) {
  return handle(async () => {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AppError(parsed.error.issues[0]?.message || "بيانات الدخول ناقصة");
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !user.active) throw new AppError("البريد أو كلمة المرور غير صحيحة", 401);
    const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!matches) throw new AppError("البريد أو كلمة المرور غير صحيحة", 401);
    await setSessionCookie(user.id);
    return { ok: true };
  });
}
