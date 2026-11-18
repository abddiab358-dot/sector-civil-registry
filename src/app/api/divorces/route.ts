import { handle, requireUser } from "@/lib/api";
import { registerDivorce } from "@/lib/registry";

export async function POST(request: Request) {
  return handle(async () => registerDivorce(await requireUser(), await request.json()));
}
