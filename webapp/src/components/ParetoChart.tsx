"use client";

import dynamic from "next/dynamic";
import type { ParetoItem } from "@/lib/queries";

const Plot = dynamic(() => import("./Plot"), { ssr: false });

export interface ParetoChartProps {
  items: ParetoItem[];
}

// ④ 부동 원인 파레토 — 막대(분) + 누적 비율선 (이중 축).
export function ParetoChart({ items }: ParetoChartProps) {
  return (
    <Plot
      data={[
        {
          type: "bar",
          x: items.map((i) => i.detail),
          y: items.map((i) => i.minutes),
          name: "분",
          marker: { color: "#2a78d6" },
          hovertemplate: "%{x}: %{y:,.0f}분<extra></extra>",
        },
        {
          type: "scatter",
          mode: "lines+markers",
          x: items.map((i) => i.detail),
          y: items.map((i) => i.cumulativeRatio * 100),
          name: "누적 비율",
          yaxis: "y2",
          line: { color: "#52514e" },
          hovertemplate: "누적 %{y:.0f}%<extra></extra>",
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
