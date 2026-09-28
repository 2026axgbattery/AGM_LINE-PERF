"use client";

import { useEffect } from "react";
import { HOME_FILTER_COOKIE, encodeHomeFilterCookie } from "@/lib/homeFilterCookie";

export interface HomeFilterPersistProps {
  mode: string;
  period?: string;
  from: string;
  to: string;
  target: number;
}

// 화면에는 아무것도 그리지 않는다 — 현재 확정된 필터 상태를 쿠키에 미러링만 해서,
// 사이드바에서 다른 화면으로 갔다가 쿼리스트링 없이 "①현황판"으로 돌아와도
// (page.tsx가 이 쿠키를 읽어) 마지막으로 보던 일별/기간별/월별·날짜가 그대로 복원되게 한다.
export function HomeFilterPersist({ mode, period, from, to, target }: HomeFilterPersistProps) {
  useEffect(() => {
    try {
      const value = encodeHomeFilterCookie({ mode, period, from, to, target: String(target) });
      document.cookie = `${HOME_FILTER_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {
      // localStorage/document.cookie가 막힌 환경(사생활 보호 모드 등)이면 그냥 유지 기능만 없이 동작
    }
  }, [mode, period, from, to, target]);

  return null;
}
