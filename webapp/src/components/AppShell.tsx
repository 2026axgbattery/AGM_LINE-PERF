import Image from "next/image";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* SEBANG 로켓보이 워터마크 — 우측 백그라운드 장식, 클릭/스크롤 방해 없게 pointer-events-none +
            고정 위치. 화면 실제 콘텐츠보다 뒤에 오도록 z-0, 콘텐츠 쪽은 z-10으로 감싼다. */}
        <Image
          src="/images/rocketboy.png"
          alt=""
          aria-hidden
          width={572}
          height={1040}
          className="pointer-events-none fixed right-0 bottom-0 z-0 h-[85vh] w-auto max-w-none opacity-15 select-none"
          priority
        />
        <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
