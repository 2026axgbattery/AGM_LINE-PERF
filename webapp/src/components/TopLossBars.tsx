import type { TopLossItem } from "@/lib/queries";

export interface TopLossBarsProps {
  items: TopLossItem[];
}

// ①현황판 라인 카드의 "부동 TOP 3" — 값 대비 상대폭 막대. 3개뿐이라 Plotly 없이 순수 CSS로 처리.
// 막대에 마우스를 올리면 그 부동유형 안에서 가장 큰 부동내역(엑셀 "부동내역" 컬럼) 상위 3건을
// 툴팁으로 보여준다 — 해당 유형에 세부 내역이 없으면(0분 등) 유형명 자체를 그대로 보여준다.
export function TopLossBars({ items }: TopLossBarsProps) {
  const max = Math.max(1, ...items.map((i) => i.minutes));

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => {
        const tooltip =
          item.details.length > 0
            ? item.details
                .map((d, i) => `${i + 1}. ${d.detail} — ${d.minutes.toLocaleString(undefined, { maximumFractionDigits: 0 })}분`)
                .join("\n")
            : item.label;

        return (
          <div key={item.label} className="group relative flex items-center gap-2 text-caption">
            <span className="w-20 shrink-0 text-text-secondary">{item.label}</span>
            <div className="h-2 flex-1 rounded-full bg-bg-base">
              <div className="h-2 rounded-full bg-text-secondary" style={{ width: `${(item.minutes / max) * 100}%` }} />
            </div>
            <span className="w-14 shrink-0 text-right text-text-primary">
              {item.minutes.toLocaleString(undefined, { maximumFractionDigits: 0 })}분
            </span>

            <div
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 hidden w-max max-w-[240px] rounded-md border border-border bg-bg-surface px-2 py-1.5 text-[0.6875rem] leading-relaxed whitespace-pre-line text-text-primary shadow-md group-hover:block"
            >
              {tooltip}
            </div>
          </div>
        );
      })}
    </div>
  );
}
