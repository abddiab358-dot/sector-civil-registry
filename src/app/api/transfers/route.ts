import { handle, requireUser } from "@/lib/api";
import { transferResidence } from "@/lib/registry";

export async function POST(request: Request) {
  return handle(async () => transferResidence(await requireUser(), await request.json()));
}
