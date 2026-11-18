"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-xl border border-line bg-card px-4 py-2 text-sm">
      طباعة
    </button>
  );
}
