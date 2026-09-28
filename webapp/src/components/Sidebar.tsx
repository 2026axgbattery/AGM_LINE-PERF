"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { NAV } from "@/lib/nav";
import { unlockAdminMode } from "@/lib/adminUnlock";
import { SebangLogo } from "./SebangLogo";
import { ThemeToggle } from "./ThemeToggle";

const UNLOCK_CLICK_COUNT = 5;
const UNLOCK_CLICK_WINDOW_MS = 1500;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const clickCount = useRef(0);
  const lastClickAt = useRef(0);

  // 로고를 짧은 시간 안에 5번 연속 클릭하면 관리자 모드로 들어간다 (사용자 확정 사항).
  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const now = Date.now();
    if (now - lastClickAt.current > UNLOCK_CLICK_WINDOW_MS) {
      clickCount.current = 0;
    }
    lastClickAt.current = now;
    clickCount.current += 1;

    if (clickCount.current >= UNLOCK_CLICK_COUNT) {
      clickCount.current = 0;
      e.preventDefault();
      unlockAdminMode();
      router.push("/settings");
    }
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-6 border-r border-border bg-bg-surface p-4">
      <Link href="/" onClick={handleLogoClick} className="text-text-primary">
        <SebangLogo className="h-10 w-auto" />
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
