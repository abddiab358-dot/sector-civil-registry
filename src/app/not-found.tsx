import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">السجل غير موجود ضمن صلاحيتك</h1>
      <Link href="/" className="text-teal">
        العودة إلى اللوحة
      </Link>
    </main>
  );
}
