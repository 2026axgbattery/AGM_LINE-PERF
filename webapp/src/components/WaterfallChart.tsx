"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("./Plot"), { ssr: false });

export interface WaterfallChartProps {
  categories: { label: string; minutes: number }[]; // 큰 순서
}

// ④ 6대부동 누적 워터폴 (분).
export function WaterfallChart({ categories }: WaterfallChartProps) {
  const total = categories.reduce((s, c) => s + c.minutes, 0);

  return (
    <Plot
      data={[
        {
          type: "waterfall",
          orientation: "v",
          x: [...categories.map((c) => c.label), "합계"],
          y: [...categories.map((c) => c.minutes), total],
          measure: [...categories.map(() => "relative" as const), "total" as const],
          connector: { line: { color: "var(--color-border)" } },
          decreasing: { marker: { color: "#eb6834" } },
          increasing: { marker: { color: "#eb6834" } },
          totals: { marker: { color: "#52514e" } },
          textposition: "outside",
          texttemplate: "%{y:,.0f}",
        },
      ]}
      layout={{
        height: 360,
        margin: { t: 20, b: 60, l: 50, r: 10 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "var(--font-family-base)", color: "var(--color-text-primary)" },
        showlegend: false,
      }}
      config={{ displayModeBar: true, responsive: true, displaylogo: false }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
