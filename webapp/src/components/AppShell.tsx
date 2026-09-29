import Image from "next/image";
import { Sidebar } from "./Sidebar";

// next/image 최적화 URL은 Cache-Control max-age=14400(4시간)로 브라우저에 캐시된다 — 파일
// 내용을 바꿔도 같은 경로(/images/rocketboy.png)면 브라우저가 서버에 물어보지도 않고 예전
// 캐시를 계속 보여준다(실제로 겪음: 이미지 교체 후에도 화면엔 예전 그림이 계속 보였다).
// 이미지 파일을 바꿀 때마다 이 버전 문자열을 올려서 URL 자체를 바꿔야 브라우저 캐시를
// 우회한다(서버의 .next/cache/images도 같이 지워야 하는 건 CLAUDE.md 참고). **이 값을 바꾸면
// next.config.ts의 images.localPatterns[].search도 반드시 같은 값으로 맞춰야 한다** —
// 안 맞으면 next/image가 400을 낸다(와일드카드 미지원, 정확히 일치해야 함).
const ROCKETBOY_VERSION = "3";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="relative z-0 flex flex-1 flex-col">{children}</div>

        {/* SEBANG 로켓보이 워터마크 — 우측 하단 배경 장식. 예전엔 콘텐츠보다 뒤(z-0)에 깔았는데,
            카드(bg-bg-surface, 불투명)가 화면을 꽉 채우는 화면에서는 그 카드들에 완전히 가려져
            사실상 안 보였다(실제로 지적받음). 그래서 반대로 콘텐츠보다 위(z-20)에 낮은
            불투명도로 얹는다 — pointer-events-none이라 클릭/스크롤은 그대로 카드가 받고,
            카드 위에 옅게 비치는 워터마크로만 보인다. 높이는 85vh였는데, ①현황판 헤더 옆의
            "가동율 산출식" 참고 박스를 페이지 맨 아래로 옮기면서 그 자리가 빈 만큼(대략
            한 줄짜리 카드 높이) 위로 더 올라오게 92vh로 키웠다. */}
        <Image
          src={`/images/rocketboy.png?v=${ROCKETBOY_VERSION}`}
          alt=""
          aria-hidden
          width={315}
          height={558}
          className="pointer-events-none fixed right-0 bottom-0 z-20 h-[92vh] w-auto max-w-none opacity-15 select-none"
          priority
        />
      </main>
    </div>
  );
}
