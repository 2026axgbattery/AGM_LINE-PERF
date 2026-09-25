"use client";

// React state로 현재 테마를 추적하지 않는다 — 서버 렌더값과 클라이언트 실제 값(inline script가
// hydration 전에 미리 정해둔 data-theme)이 달라 hydration mismatch가 나기 쉽다.
// 대신 두 라벨을 항상 함께 렌더링해두고 CSS(dark: variant)로 하나만 보이게 한다.
function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {}
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="text-body-sm flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-text-secondary hover:bg-bg-surface"
      aria-label="다크 모드 전환"
    >
      <span className="dark:hidden">☀️ 라이트 모드</span>
      <span className="hidden dark:inline">🌙 다크 모드</span>
    </button>
  );
}
