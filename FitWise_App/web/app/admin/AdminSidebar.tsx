"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "⌂" },
  { href: "/admin/trainers", label: "Trainers", icon: "●" },
  { href: "/admin/trainers/new", label: "Add Trainer", icon: "＋" },
  { href: "/admin/members", label: "Members", icon: "◎" },
  { href: "/admin/exercises", label: "Exercise Catalogue", icon: "▣" },
  { href: "/admin/activity", label: "Activity Log", icon: "≡" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav>
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/admin" || item.href === "/admin/trainers"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={`app-side-link${active ? " active" : ""}`}>
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
