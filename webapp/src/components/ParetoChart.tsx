"use client";

import dynamic from "next/dynamic";
import type { ParetoItem } from "@/lib/queries";

const Plot = dynamic(() => import("./Plot"), { ssr: false });

export interface ParetoChartProps {
  items: ParetoItem[];
}

// 6대부동 분석 — 부동 원인 파레토 — 막대(분) + 누적 비율선 (이중 축).
// 막대 순서가 이미 큰 순이라 매 막대 호버에 순위(N위)와 전체 부동 대비 비중(%)을 같이 보여줘
// 어떤 항목이 가장 큰지 굳이 눈으로 세지 않아도 되게 한다(①현황판 부동 TOP3 호버와 같은 목적).
export function ParetoChart({ items }: ParetoChartProps) {
  return (
    <Plot
      data={[
        {
          type: "bar",
          x: items.map((i) => i.detail),
          y: items.map((i) => i.minutes),
          customdata: items.map((i, idx) => [idx + 1, i.ratio * 100]),
          name: "분",
          marker: { color: "#2a78d6" },
          hovertemplate: "%{customdata[0]}위 · %{x}<br>%{y:,.0f}분 (전체 부동의 %{customdata[1]:.1f}%)<extra></extra>",
        },
        {
          type: "scatter",
          mode: "lines+markers",
          x: items.map((i) => i.detail),
          y: items.map((i) => i.cumulativeRatio * 100),
          name: "누적 비율",
          yaxis: "y2",
          line: { color: "#52514e" },
          hovertemplate: "누적 %{y:.1f}%<extra></extra>",
        },
      ]}
      layout={{
        height: 380,
        margin: { t: 20, b: 100, l: 50, r: 50 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "var(--font-family-base)", color: "var(--color-text-primary)" },
        xaxis: { tickangle: -30, tickfont: { size: 10 } },
        yaxis: { title: { text: "분" } },
        yaxis2: { title: { text: "누적 %" }, overlaying: "y", side: "right", range: [0, 100] },
        legend: { orientation: "h", y: -0.5 },
      }}
      config={{ displayModeBar: true, displaylogo: false }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
