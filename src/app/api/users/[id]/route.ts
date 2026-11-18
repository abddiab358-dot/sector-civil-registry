import { z } from "zod";
import { handle, requireUser } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { setUserActive } from "@/lib/registry";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const parsed = z.object({ active: z.boolean() }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new AppError("بيانات غير مكتملة");
    return setUserActive(user, id, parsed.data.active);
  });
}
