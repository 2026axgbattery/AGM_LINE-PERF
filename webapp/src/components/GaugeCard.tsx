"use client";

import dynamic from "next/dynamic";
import { rateStatus } from "@/lib/status";

// Plotly는 브라우저 전용(document 접근)이라 SSR을 꺼야 한다. dynamic({ssr:false})는
// Client Component 안에서만 허용되므로 이 파일 전체가 "use client"여야 한다.
const Plot = dynamic(() => import("./Plot"), { ssr: false });

export interface GaugeCardProps {
  label: string;
  rate: number; // 0~1
  target: number; // 0~1
}

// ①현황판 라인별 카드의 링 게이지. M3에서 실데이터(SQLite 집계)를 이 컴포넌트에 그대로 연결한다.
export function GaugeCard({ label, rate, target }: GaugeCardProps) {
  const status = rateStatus(rate, target);

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-bg-surface p-4">
      <div className="text-body-sm font-semibold text-text-primary">{label}</div>
      <Plot
        data={[
          {
            type: "indicator",
            mode: "gauge+number",
            value: rate * 100,
            number: { suffix: "%", font: { size: 28 } },
            gauge: {
              axis: { range: [0, 100], tickfont: { size: 10 } },
              bar: { color: status.color },
              threshold: {
                line: { color: "#52514e", width: 3 },
                thickness: 0.8,
                value: target * 100,
              },
            },
          },
        ]}
        layout={{
          width: 200,
          height: 160,
          margin: { t: 20, b: 10, l: 20, r: 20 },
          paper_bgcolor: "transparent",
          font: { family: "var(--font-family-base)" },
        }}
        config={{ displayModeBar: false, responsive: true }}
      />
      <span
        className="text-caption rounded-full px-3 py-1 font-semibold"
        style={{ color: status.color, backgroundColor: `${status.color}22` }}
      >
        {status.label}
      </span>
    </div>
  );
}
