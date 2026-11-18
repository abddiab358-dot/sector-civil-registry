export function Seal({ className = "h-14 w-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M18 42c3.5-9 8-14 14-14s10.5 5 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M32 16v12" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="32" cy="16" r="2.4" fill="currentColor" />
      <path d="M24 24h16" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
