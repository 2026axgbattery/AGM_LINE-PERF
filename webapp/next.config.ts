import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 폴더(agm-oee)의 package-lock.json과 이 폴더의 lockfile이 함께 잡혀
  // 워크스페이스 루트가 잘못 추론되는 것을 막는다 (webapp만 Node.js 앱의 루트).
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    // AppShell.tsx의 로켓보이 워터마크가 "?v=N" 쿼리스트링으로 브라우저 캐시를 우회한다
    // (CLAUDE.md 참고) — next/image가 이 쿼리스트링을 허용하려면 명시적으로 등록해야 하는데,
    // localPatterns의 search는 와일드카드(*)를 지원하지 않고 정확히 일치해야 한다(실제로
    // "?v=*"로 써봤다가 전부 400이 나서 확인함). AppShell.tsx의 ROCKETBOY_VERSION을 올릴
    // 때마다 여기 search 값도 그 버전으로 맞춰 고쳐야 한다.
    localPatterns: [{ pathname: "/images/rocketboy.png", search: "?v=3" }],
  },
};

export default nextConfig;
