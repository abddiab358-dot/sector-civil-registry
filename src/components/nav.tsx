"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const groups: { title: string; items: { href: string; label: string; roles: Role[] }[] }[] = [
  {
    title: "السجل",
    items: [
      { href: "/", label: "اللوحة", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] },
      { href: "/persons", label: "السكان", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] },
      { href: "/families", label: "دفاتر العائلة", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] },
    ],
  },
  {
    title: "المعاملات",
    items: [
      { href: "/births", label: "الولادات", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] },
      { href: "/deaths", label: "الوفيات", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] },
      { href: "/marriages", label: "الزواج", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] },
      { href: "/divorces", label: "الطلاق", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] },
      { href: "/identities", label: "الهويات", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] },
    ],
  },
  {
    title: "المتابعة",
    items: [
      { href: "/reports", label: "التقارير", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] },
      { href: "/users", label: "المستخدمون", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER"] },
      { href: "/sectors", label: "القطاعات", roles: ["CENTRAL_ADMIN"] },
      { href: "/audit", label: "سجل التدقيق", roles: ["CENTRAL_ADMIN", "SECTOR_MANAGER", "REGISTRAR", "ANALYST"] },
    ],
  },
];

export function SideNav({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <div className="space-y-4 px-3 py-2">
      {groups.map((group) => {
        const items = group.items.filter((item) => item.roles.includes(role));
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="px-3 pb-1 text-[11px] tracking-wide text-paper/45">{group.title}</p>
            <div className="flex gap-1 overflow-x-auto lg:flex-col">
              {items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-xl px-3 py-2 text-sm ${active ? "bg-white/10 text-gold" : "text-paper/80 hover:bg-white/10"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
