import { handle, requireUser } from "@/lib/api";
import { updateSector } from "@/lib/registry";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    return updateSector(user, id, await request.json());
  });
}
