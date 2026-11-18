import { handle, requireUser } from "@/lib/api";
import { registerMarriage } from "@/lib/registry";

export async function POST(request: Request) {
  return handle(async () => registerMarriage(await requireUser(), await request.json()));
}
