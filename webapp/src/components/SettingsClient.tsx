"use client";

import { useEffect, useState } from "react";
import { ADMIN_UNLOCK_EVENT, isAdminUnlocked, lockAdminMode } from "@/lib/adminUnlock";
import { AdminPanel, type AdminUploadRow } from "./AdminPanel";
import { PlaceholderPage } from "./PlaceholderPage";

type View = "loading" | "locked" | "unlocked";

export function SettingsClient({ uploads }: { uploads: AdminUploadRow[] }) {
  // "loading"에서 시작해 서버와 첫 클라이언트 렌더가 항상 같게 만든다(ThemeToggle.tsx와 같은
  // 이유의 hydration-safety 패턴) — localStorage 확인은 마운트 후 이펙트에서만 한다.
  const [view, setView] = useState<View>("loading");

  useEffect(() => {
    // 브라우저 전용 값(localStorage)을 마운트 후 한 번만 동기화하는 의도된 패턴이라 무시한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(isAdminUnlocked() ? "unlocked" : "locked");

    function onChange() {
      setView(isAdminUnlocked() ? "unlocked" : "locked");
    }
    window.addEventListener("storage", onChange);
    window.addEventListener(ADMIN_UNLOCK_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(ADMIN_UNLOCK_EVENT, onChange);
    };
  }, []);

  if (view !== "unlocked") {
    return <PlaceholderPage title="설정" milestone="추후 단계 (목표 가동율 등)" />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-h1">설정</h1>
      <AdminPanel uploads={uploads} onLock={lockAdminMode} />
    </div>
  );
}
