import { handle, requireUser } from "@/lib/api";
import { registerBirth } from "@/lib/registry";

export async function POST(request: Request) {
  return handle(async () => registerBirth(await requireUser(), await request.json()));
}
