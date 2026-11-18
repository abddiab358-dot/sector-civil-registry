import { handle, requireUser } from "@/lib/api";
import { registerIdentity } from "@/lib/registry";

export async function POST(request: Request) {
  return handle(async () => registerIdentity(await requireUser(), await request.json()));
}
