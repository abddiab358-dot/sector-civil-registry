"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PersonSearch, type PersonHit } from "./person-search";
import { controlClass } from "./ui";

type SectorOption = { id: string; name: string };

function useSubmit(url: string, method = "POST") {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(payload: unknown) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "تعذر تنفيذ العملية");
        return null;
      }
      return data as Record<string, string>;
    } catch {
      setError("تعذر الاتصال بالخادم");
      return null;
    } finally {
      setPending(false);
    }
  }

  return { submit, error, pending };
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 rounded-3xl border border-line bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="md:col-span-2 rounded-xl bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>;
}

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button disabled={pending} className="h-11 rounded-xl bg-teal px-5 text-sm font-medium text-white hover:bg-pine disabled:opacity-60">
      {pending ? "جارٍ الحفظ..." : label}
    </button>
  );
}

export function BirthForm({ sectors }: { sectors: SectorOption[] }) {
  const router = useRouter();
  const { submit, error, pending } = useSubmit("/api/births");
  const [fatherName, setFatherName] = useState("");
  const [grandfatherName, setGrandfatherName] = useState("");
  const [familyName, setFamilyName] = useState("");

  return (
    <Panel title="تسجيل ولادة">
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
          const result = await submit(payload);
          if (result?.personId) router.push(`/persons/${result.personId}?ok=birth&no=${result.documentNo}`);
        }}
      >
        <label className="text-sm">
          الاسم
          <input name="firstName" required className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          اسم الأب
          <input name="fatherName" required value={fatherName} onChange={(event) => setFatherName(event.target.value)} className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          اسم الجد
          <input name="grandfatherName" required value={grandfatherName} onChange={(event) => setGrandfatherName(event.target.value)} className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          اسم العائلة
          <input name="familyName" required value={familyName} onChange={(event) => setFamilyName(event.target.value)} className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          الجنس
          <select name="gender" className={`${controlClass} mt-1.5`} defaultValue="MALE">
            <option value="MALE">ذكر</option>
            <option value="FEMALE">أنثى</option>
          </select>
        </label>
        <label className="text-sm">
          تاريخ الولادة
          <input type="date" name="birthDate" required className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm md:col-span-2">
          مكان الولادة
          <input name="birthPlace" required className={`${controlClass} mt-1.5`} />
        </label>
        <PersonSearch
          label="الأب"
          name="fatherId"
          query={{ gender: "MALE" }}
          onPick={(person: PersonHit | null) => {
            if (!person) return;
            setFatherName(person.firstName);
            setGrandfatherName(person.fatherName);
            setFamilyName(person.familyName);
          }}
        />
        <PersonSearch label="الأم" name="motherId" query={{ gender: "FEMALE" }} />
        {sectors.length > 0 ? (
          <label className="text-sm md:col-span-2">
            قطاع التسجيل
            <select name="sectorId" className={`${controlClass} mt-1.5`} defaultValue={sectors[0]?.id}>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-sm md:col-span-2">
          ملاحظات
          <textarea name="notes" className={`${controlClass} mt-1.5 h-24 py-2`} />
        </label>
        <ErrorNote error={error} />
        <Submit pending={pending} label="حفظ شهادة الولادة" />
      </form>
    </Panel>
  );
}

export function DeathForm() {
  const router = useRouter();
  const { submit, error, pending } = useSubmit("/api/deaths");
  return (
    <Panel title="تسجيل وفاة">
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await submit(Object.fromEntries(new FormData(event.currentTarget).entries()));
          if (result?.personId) router.push(`/persons/${result.personId}?ok=death&no=${result.documentNo}`);
        }}
      >
        <PersonSearch label="الفرد" name="personId" query={{ alive: "1" }} />
        <label className="text-sm">
          تاريخ الوفاة
          <input type="date" name="eventDate" required className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          المكان
          <input name="place" required className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          السبب
          <input name="cause" className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm md:col-span-2">
          ملاحظات
          <textarea name="notes" className={`${controlClass} mt-1.5 h-24 py-2`} />
        </label>
        <ErrorNote error={error} />
        <Submit pending={pending} label="حفظ شهادة الوفاة" />
      </form>
    </Panel>
  );
}

export function MarriageForm({ sectors }: { sectors: SectorOption[] }) {
  const router = useRouter();
  const { submit, error, pending } = useSubmit("/api/marriages");
  return (
    <Panel title="عقد زواج">
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await submit(Object.fromEntries(new FormData(event.currentTarget).entries()));
          if (result?.documentNo) router.push(`/marriages?ok=marriage&no=${result.documentNo}`);
        }}
      >
        <PersonSearch label="الزوج" name="husbandId" query={{ gender: "MALE", alive: "1", unmarried: "1", adult: "1" }} />
        <PersonSearch label="الزوجة" name="wifeId" query={{ gender: "FEMALE", alive: "1", unmarried: "1", adult: "1" }} />
        <label className="text-sm">
          تاريخ العقد
          <input type="date" name="eventDate" required className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          مكان العقد
          <input name="place" required className={`${controlClass} mt-1.5`} />
        </label>
        {sectors.length > 0 ? (
          <label className="text-sm md:col-span-2">
            قطاع الإصدار
            <select name="sectorId" className={`${controlClass} mt-1.5`} defaultValue={sectors[0]?.id}>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-sm md:col-span-2">
          ملاحظات
          <textarea name="notes" className={`${controlClass} mt-1.5 h-24 py-2`} />
        </label>
        <ErrorNote error={error} />
        <Submit pending={pending} label="حفظ عقد الزواج" />
      </form>
    </Panel>
  );
}

export function DivorceForm({ marriages }: { marriages: { id: string; label: string }[] }) {
  const router = useRouter();
  const { submit, error, pending } = useSubmit("/api/divorces");
  return (
    <Panel title="تسجيل طلاق">
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await submit(Object.fromEntries(new FormData(event.currentTarget).entries()));
          if (result?.documentNo) router.push(`/divorces?ok=divorce&no=${result.documentNo}`);
        }}
      >
        <label className="text-sm md:col-span-2">
          عقد الزواج القائم
          <select name="marriageId" required className={`${controlClass} mt-1.5`} defaultValue="">
            <option value="" disabled>
              اختر العقد
            </option>
            {marriages.map((marriage) => (
              <option key={marriage.id} value={marriage.id}>
                {marriage.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          تاريخ الطلاق
          <input type="date" name="eventDate" required className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          المكان
          <input name="place" required className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm md:col-span-2">
          ملاحظات
          <textarea name="notes" className={`${controlClass} mt-1.5 h-24 py-2`} />
        </label>
        <ErrorNote error={error} />
        <Submit pending={pending} label="حفظ سجل الطلاق" />
      </form>
    </Panel>
  );
}

export function IdentityForm() {
  const router = useRouter();
  const { submit, error, pending } = useSubmit("/api/identities");
  return (
    <Panel title="إصدار أو تجديد أو إلغاء">
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await submit(Object.fromEntries(new FormData(event.currentTarget).entries()));
          if (result?.personId) router.push(`/persons/${result.personId}?ok=identity&no=${result.documentNo}`);
        }}
      >
        <PersonSearch label="الفرد الحي" name="personId" query={{ alive: "1" }} />
        <label className="text-sm">
          الإجراء
          <select name="mode" className={`${controlClass} mt-1.5`} defaultValue="issue">
            <option value="issue">إصدار</option>
            <option value="renew">تجديد</option>
            <option value="cancel">إلغاء</option>
          </select>
        </label>
        <ErrorNote error={error} />
        <Submit pending={pending} label="تنفيذ" />
      </form>
    </Panel>
  );
}

export function TransferForm({ sectors, personId }: { sectors: SectorOption[]; personId: string }) {
  const router = useRouter();
  const { submit, error, pending } = useSubmit("/api/transfers");
  return (
    <form
      className="grid gap-3 rounded-3xl border border-line bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
        const result = await submit({ ...payload, personId });
        if (result) router.push(`/persons/${personId}?ok=transfer`);
      }}
    >
      <p className="font-medium">نقل الإقامة</p>
      <select name="sectorId" className={controlClass} defaultValue={sectors[0]?.id}>
        {sectors.map((sector) => (
          <option key={sector.id} value={sector.id}>
            {sector.name}
          </option>
        ))}
      </select>
      <ErrorNote error={error} />
      <Submit pending={pending} label="نقل" />
    </form>
  );
}

export function PlaceForm({ personId, initial }: { personId: string; initial: string }) {
  const router = useRouter();
  const { submit, error, pending } = useSubmit(`/api/persons/${personId}`, "PATCH");
  return (
    <form
      className="grid gap-3 rounded-3xl border border-line bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await submit(Object.fromEntries(new FormData(event.currentTarget).entries()));
        if (result) {
          router.push(`/persons/${personId}?ok=place`);
          router.refresh();
        }
      }}
    >
      <p className="font-medium">مكان الولادة</p>
      <input name="birthPlace" defaultValue={initial} className={controlClass} />
      <ErrorNote error={error} />
      <Submit pending={pending} label="تحديث" />
    </form>
  );
}

export function UserForm({ sectors, roles }: { sectors: SectorOption[]; roles: { value: string; label: string }[] }) {
  const router = useRouter();
  const { submit, error, pending } = useSubmit("/api/users");
  return (
    <Panel title="حساب جديد">
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await submit(Object.fromEntries(new FormData(event.currentTarget).entries()));
          if (result) {
            router.push("/users?ok=user");
            router.refresh();
          }
        }}
      >
        <label className="text-sm">
          الاسم
          <input name="name" required className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          البريد
          <input type="email" name="email" required className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          كلمة المرور
          <input type="password" name="password" required minLength={8} className={`${controlClass} mt-1.5`} />
        </label>
        <label className="text-sm">
          الدور
          <select name="role" className={`${controlClass} mt-1.5`}>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>
        {sectors.length > 0 ? (
          <label className="text-sm md:col-span-2">
            القطاع
            <select name="sectorId" className={`${controlClass} mt-1.5`} defaultValue="">
              <option value="">بدون قطاع (مركزي)</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <ErrorNote error={error} />
        <Submit pending={pending} label="إنشاء الحساب" />
      </form>
    </Panel>
  );
}

export function UserActiveButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const response = await fetch(`/api/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !active }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error || "تعذر التحديث");
          return;
        }
        router.refresh();
      }}
    >
      <button className="text-sm text-teal">{active ? "إيقاف" : "تفعيل"}</button>
      {error ? <span className="mr-2 text-xs text-bad">{error}</span> : null}
    </form>
  );
}

export function SectorEditor({ sector }: { sector: { id: string; name: string; active: boolean } }) {
  const router = useRouter();
  const { submit, error, pending } = useSubmit(`/api/sectors/${sector.id}`, "PATCH");
  return (
    <form
      className="grid gap-3 rounded-3xl border border-line bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const result = await submit({ name: form.get("name"), active: form.get("active") === "on" });
        if (result) {
          router.push("/sectors?ok=sector");
          router.refresh();
        }
      }}
    >
      <input name="name" defaultValue={sector.name} className={controlClass} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={sector.active} />
        نشط ويقبل معاملات
      </label>
      <ErrorNote error={error} />
      <Submit pending={pending} label="حفظ" />
    </form>
  );
}
