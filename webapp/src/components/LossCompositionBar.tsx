"use client";

import dynamic from "next/dynamic";
import { LOSS_CATEGORY_COLOR } from "@/lib/lossCategories";

const Plot = dynamic(() => import("./AnimatedPlot").then((m) => m.AnimatedPlot), { ssr: false });

const OPERATING_COLOR = "#6b7a84"; // "가동" 구간 — 부동유형이 아니라 별도 고정색

export interface LossCompositionBarProps {
  operatingMinutes: number;
  categories: { label: string; minutes: number }[];
}

// 6대부동 분석 — 계획가동시간 100% 구성 — 가동 vs 6대부동 유형별 비중 (가로 누적 막대 1줄).
export function LossCompositionBar({ operatingMinutes, categories }: LossCompositionBarProps) {
  const segments = [{ label: "가동", minutes: operatingMinutes }, ...categories];
  const total = segments.reduce((s, c) => s + c.minutes, 0) || 1;

  return (
    <Plot
      data={segments.map((seg) => ({
        type: "bar",
        orientation: "h",
        x: [seg.minutes],
        y: ["계획가동시간"],
        name: `${seg.label} (${((seg.minutes / total) * 100).toFixed(1)}%)`,
        marker: { color: LOSS_CATEGORY_COLOR[seg.label] ?? OPERATING_COLOR },
        hovertemplate: `${seg.label}: %{x:,.0f}분<extra></extra>`,
      }))}
      layout={{
        barmode: "stack",
        height: 210,
        margin: { t: 10, b: 110, l: 10, r: 10 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "var(--font-family-base)", color: "var(--color-text-primary)" },
        yaxis: { visible: false },
        // 항목이 7개라 좁은 화면에서 두세 줄로 줄바꿈된다 — x축 눈금과 겹치지 않도록 충분히 아래로 뺀다.
        legend: { orientation: "h", y: -0.9, x: 0.5, xanchor: "center" },
      }}
      config={{ displayModeBar: false }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
