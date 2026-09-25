export interface TopLossBarsProps {
  items: { label: string; minutes: number }[];
}

// ①현황판 라인 카드의 "부동 TOP 3" — 값 대비 상대폭 막대. 3개뿐이라 Plotly 없이 순수 CSS로 처리.
export function TopLossBars({ items }: TopLossBarsProps) {
  const max = Math.max(1, ...items.map((i) => i.minutes));

  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-caption">
          <span className="w-20 shrink-0 text-text-secondary">{item.label}</span>
          <div className="h-2 flex-1 rounded-full bg-bg-base">
            <div
              className="h-2 rounded-full bg-text-secondary"
              style={{ width: `${(item.minutes / max) * 100}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-text-primary">
            {item.minutes.toLocaleString(undefined, { maximumFractionDigits: 0 })}분
          </span>
        </div>
      ))}
    </div>
  );
}
