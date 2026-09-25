"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("./Plot"), { ssr: false });

const SEGMENT_COLORS = ["#6b7a84", "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];

export interface LossCompositionBarProps {
  operatingMinutes: number;
  categories: { label: string; minutes: number }[];
}

// ④ 계획가동시간 100% 구성 — 가동 vs 6대부동 유형별 비중 (가로 누적 막대 1줄).
export function LossCompositionBar({ operatingMinutes, categories }: LossCompositionBarProps) {
  const segments = [{ label: "가동", minutes: operatingMinutes }, ...categories];
  const total = segments.reduce((s, c) => s + c.minutes, 0) || 1;

  return (
    <Plot
      data={segments.map((seg, i) => ({
        type: "bar",
        orientation: "h",
        x: [seg.minutes],
        y: ["계획가동시간"],
        name: `${seg.label} (${((seg.minutes / total) * 100).toFixed(1)}%)`,
        marker: { color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] },
        hovertemplate: `${seg.label}: %{x:,.0f}분<extra></extra>`,
      }))}
      layout={{
        barmode: "stack",
        height: 130,
        margin: { t: 10, b: 30, l: 10, r: 10 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "var(--font-family-base)", color: "var(--color-text-primary)" },
        yaxis: { visible: false },
        legend: { orientation: "h", y: -0.3 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
