import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "AGM 가동율 대시보드",
  description: "AGM 조립 1~4라인 가동율 대시보드",
};

// data-theme 없이(=system) 렌더링된 뒤 클라이언트 스크립트가 저장된 선호값을 붙이면
// 다크 모드 사용자에게 라이트 화면이 잠깐 번쩍이므로(FOUC), <html>이 그려지기 전에 동기 실행한다.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* public/design/sebang.css는 npm run sync:design이 만든 정적 파일이라 CSS @import로 못
            묶는다(Turbopack이 webapp/ 밖 경로를 막음, globals.css 주석 참고) — 의도적인 수동 link다. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/design/sebang.css" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
