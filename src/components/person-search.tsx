"use client";

import { useEffect, useState } from "react";
import { controlClass } from "./ui";

export type PersonHit = {
  id: string;
  nationalId: string;
  name: string;
  firstName: string;
  fatherName: string;
  familyName: string;
  sectorName: string;
};

export function PersonSearch({
  label,
  name,
  query,
  onPick,
}: {
  label: string;
  name: string;
  query?: Record<string, string>;
  onPick?: (person: PersonHit | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<PersonHit[]>([]);
  const [picked, setPicked] = useState<PersonHit | null>(null);
  const [open, setOpen] = useState(false);
  const queryKey = JSON.stringify(query ?? {});

  useEffect(() => {
    if (picked || term.trim().length < 2) return;
    const handle = setTimeout(async () => {
      const params = new URLSearchParams({ q: term.trim(), ...query });
      const response = await fetch(`/api/persons/search?${params.toString()}`);
      const data = await response.json();
      setHits(Array.isArray(data.people) ? data.people : []);
      setOpen(true);
    }, 250);
    return () => clearTimeout(handle);
  }, [term, picked, queryKey, query]);

  return (
    <div className="relative">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>
      <input type="hidden" name={name} value={picked?.id ?? ""} />
      {picked ? (
        <div className="flex h-11 items-center justify-between rounded-xl border border-teal/40 bg-teal/5 px-3 text-sm">
          <span>
            {picked.name}
            <span className="mr-2 text-ink/50">{picked.nationalId}</span>
          </span>
          <button
            type="button"
            className="text-bad"
            onClick={() => {
              setPicked(null);
              setTerm("");
              onPick?.(null);
            }}
          >
            تغيير
          </button>
        </div>
      ) : (
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => setOpen(true)}
          className={controlClass}
          placeholder="ابحث بالاسم أو الرقم الوطني"
          autoComplete="off"
        />
      )}
      {open && !picked && hits.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-card shadow-lg">
          {hits.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-right text-sm hover:bg-paper"
                onClick={() => {
                  setPicked(person);
                  setOpen(false);
                  onPick?.(person);
                }}
              >
                <span className="font-medium">{person.name}</span>
                <span className="mt-0.5 block text-xs text-ink/55">
                  {person.nationalId} · {person.sectorName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
