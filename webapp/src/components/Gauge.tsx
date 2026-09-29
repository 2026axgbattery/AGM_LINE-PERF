"use client";

import dynamic from "next/dynamic";

// Plotly는 브라우저 전용(document 접근)이라 SSR을 꺼야 한다. dynamic({ssr:false})는
// Client Component 안에서만 허용되므로 이 파일 전체가 "use client"여야 한다.
const Plot = dynamic(() => import("./AnimatedPlot").then((m) => m.AnimatedPlot), { ssr: false });

export interface GaugeProps {
  rate: number; // 0~1
  target: number; // 0~1
  color: string;
  isNoData?: boolean; // rate===1(6대부동 0분)일 때 true — "100%" 대신 "비가동" 텍스트로 표시
}

// ①현황판 라인별 카드의 링 게이지 차트 부분만 담당한다 (카드 레이아웃은 LineStatusCard가 맡음).
// 카드 폭에 맞춰 최대한 크게 보이도록 고정 width 대신 useResizeHandler로 반응형 처리한다
// (다른 Plotly 컴포넌트들, 예: WaterfallChart.tsx와 같은 패턴).
export function Gauge({ rate, target, color, isNoData }: GaugeProps) {
  // Plotly indicator의 number 서브트레이스는 숫자만 받을 수 있어 "비가동" 같은 문자열을 못
  // 넣는다 — number를 아예 빼고(mode="gauge") layout.annotations로 가운데에 텍스트를 얹는다.
  return (
    <Plot
      data={[
        {
          type: "indicator",
          mode: isNoData ? "gauge" : "gauge+number",
          value: rate * 100,
          number: { suffix: "%", valueformat: ".1f", font: { size: 34 } },
          gauge: {
            axis: { range: [0, 100], tickfont: { size: 11 } },
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
        height: 190,
        margin: { t: 18, b: 6, l: 16, r: 16 },
        paper_bgcolor: "transparent",
        font: { family: "var(--font-family-base)" },
        annotations: isNoData
          ? [
              {
                text: "비가동",
                showarrow: false,
                x: 0.5,
                y: 0.3,
                xref: "paper",
                yref: "paper",
                font: { size: 24, color },
              },
            ]
          : [],
      }}
      config={{ displayModeBar: false }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
