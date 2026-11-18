import { handle, requireUser } from "@/lib/api";
import { registerDeath } from "@/lib/registry";

export async function POST(request: Request) {
  return handle(async () => registerDeath(await requireUser(), await request.json()));
}
