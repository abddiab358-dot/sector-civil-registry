import { handle, requireUser } from "@/lib/api";
import { fullName } from "@/lib/format";
import { searchPersons } from "@/lib/queries";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    const url = new URL(request.url);
    const people = await searchPersons(user, {
      q: url.searchParams.get("q") ?? "",
      gender: url.searchParams.get("gender") ?? undefined,
      alive: url.searchParams.get("alive") ?? undefined,
      unmarried: url.searchParams.get("unmarried") ?? undefined,
      adult: url.searchParams.get("adult") ?? undefined,
    });
    return {
      people: people.map((person) => ({
        id: person.id,
        nationalId: person.nationalId,
        name: fullName(person),
        firstName: person.firstName,
        fatherName: person.fatherName,
        familyName: person.familyName,
        sectorName: person.sector.name,
      })),
    };
  });
}
