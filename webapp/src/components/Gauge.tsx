"use client";

import dynamic from "next/dynamic";

// Plotly는 브라우저 전용(document 접근)이라 SSR을 꺼야 한다. dynamic({ssr:false})는
// Client Component 안에서만 허용되므로 이 파일 전체가 "use client"여야 한다.
const Plot = dynamic(() => import("./Plot"), { ssr: false });

export interface GaugeProps {
  rate: number; // 0~1
  target: number; // 0~1
  color: string;
}

// ①현황판 라인별 카드의 링 게이지 차트 부분만 담당한다 (카드 레이아웃은 LineStatusCard가 맡음).
export function Gauge({ rate, target, color }: GaugeProps) {
  return (
    <Plot
      data={[
        {
          type: "indicator",
          mode: "gauge+number",
          value: rate * 100,
          number: { suffix: "%", font: { size: 28 } },
          gauge: {
            axis: { range: [0, 100], tickfont: { size: 10 } },
            bar: { color },
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
  );
}
