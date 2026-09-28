"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Matches the POC's appSidebarItems exactly (FitWise_POC_Demo_Package/FitWise_POC_Demo_Enhanced.html).
const NAV_ITEMS = [
  { href: "/trainer", label: "Dashboard", icon: "⌂" },
  { href: "/trainer/members", label: "Members", icon: "●" },
  { href: "/trainer/members/new", label: "Register Member", icon: "＋" },
  { href: "/trainer/predictions", label: "Predictions", icon: "⌁" },
  { href: "/trainer/plans", label: "Workout Plans", icon: "▣" },
  { href: "/trainer/analytics", label: "Progress & Analytics", icon: "▥" },
  { href: "/trainer/alerts", label: "Alerts", icon: "!" },
  { href: "/trainer/settings", label: "Settings", icon: "⚙" },
];

export function TrainerSidebar() {
  const pathname = usePathname();

  return (
    <nav>
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/trainer" ? pathname === "/trainer" : pathname.startsWith(item.href);
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
