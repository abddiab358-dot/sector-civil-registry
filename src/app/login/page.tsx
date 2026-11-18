import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Seal } from "@/components/seal";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <div>
          <Seal className="h-16 w-16 text-gold" />
          <h1 className="mt-8 text-4xl font-semibold leading-snug">السجل المدني للقطاعات الثلاثة</h1>
          <p className="mt-4 max-w-md text-paper/75 leading-8">
            سجل سكان موحّد، دفاتر عائلة، ووثائق ولادة ووفاة وزواج وطلاق وهوية. كل قطاع يرى سكانه، والإدارة المركزية ترى الجميع.
          </p>
        </div>
        <ul className="space-y-3 text-sm text-gold">
          <li>القطاع الشمالي</li>
          <li>القطاع الأوسط</li>
          <li>القطاع الجنوبي</li>
        </ul>
      </section>
      <section className="flex items-center justify-center p-6">
        <LoginForm />
      </section>
    </main>
  );
}
