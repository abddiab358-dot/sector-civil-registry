"use client";

import { useState } from "react";
import { Seal } from "@/components/seal";
import { controlClass } from "@/components/ui";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(typeof data.error === "string" ? data.error : "تعذر الدخول");
          setPending(false);
          return;
        }
        window.location.href = "/";
      }}
    >
      <div className="mb-6 flex items-center gap-3 lg:hidden">
        <Seal className="h-12 w-12 text-gold" />
        <div>
          <p className="font-semibold">السجل المدني</p>
          <p className="text-xs text-ink/60">ثلاثة قطاعات</p>
        </div>
      </div>
      <h1 className="text-2xl font-semibold">دخول الموظفين</h1>
      <p className="mt-2 text-sm leading-6 text-ink/65">الحسابات التجريبية موثّقة في دليل التشغيل. كلمة المرور الموحّدة Demo@2026</p>
      <label className="mt-5 block text-sm">
        البريد الوظيفي
        <input name="email" type="email" required className={`${controlClass} mt-1.5`} placeholder="admin@registry.local" />
      </label>
      <label className="mt-4 block text-sm">
        كلمة المرور
        <input name="password" type="password" required className={`${controlClass} mt-1.5`} />
      </label>
      {error ? <p className="mt-4 rounded-xl bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p> : null}
      <button disabled={pending} className="mt-5 h-11 w-full rounded-xl bg-teal text-sm font-medium text-white hover:bg-pine disabled:opacity-60">
        {pending ? "جارٍ التحقق..." : "دخول"}
      </button>
    </form>
  );
}
