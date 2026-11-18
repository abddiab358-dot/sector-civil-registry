import { handle, requireUser } from "@/lib/api";
import { createUser } from "@/lib/registry";

export async function POST(request: Request) {
  return handle(async () => createUser(await requireUser(), await request.json()));
}
