import { handle, requireUser } from "@/lib/api";
import { updateBirthPlace } from "@/lib/registry";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    return updateBirthPlace(user, id, await request.json());
  });
}
