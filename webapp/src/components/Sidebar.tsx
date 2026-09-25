"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { SebangLogo } from "./SebangLogo";
import { ThemeToggle } from "./ThemeToggle";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-6 border-r border-border bg-bg-surface p-4">
      <Link href="/" className="text-text-primary">
        <SebangLogo className="h-6 w-auto" />
      </Link>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {NAV.map((group, i) => (
          <div key={group.label ?? i} className="flex flex-col gap-1">
            {group.label && (
              <div className="text-caption px-2 text-text-secondary uppercase tracking-wide">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "text-body-sm rounded-md px-2 py-2 transition-colors " +
                    (active
                      ? "bg-accent-primary text-white"
                      : "text-text-primary hover:bg-bg-base")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <ThemeToggle />
    </aside>
  );
}
