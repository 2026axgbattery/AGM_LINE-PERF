"use client";

import dynamic from "next/dynamic";
import { LINE_SHORT_LABEL } from "@/lib/lines";
import { LOSS_LABELS } from "@/lib/lossCategories";

const Plot = dynamic(() => import("./Plot"), { ssr: false });

export interface CategoryHeatmapProps {
  categoryTotals: { line: string; values: number[] }[]; // values는 LOSS_LABELS 순서
}

// ③ 보조 히트맵: 부동유형 × 라인 (월 합계, 분) — 어떤 유형이 어느 라인에 몰려있는지.
export function CategoryHeatmap({ categoryTotals }: CategoryHeatmapProps) {
  const x = categoryTotals.map((c) => LINE_SHORT_LABEL[c.line] ?? c.line);
  const y = LOSS_LABELS.map((c) => c.label);
  const z = LOSS_LABELS.map((_, catIdx) => categoryTotals.map((c) => c.values[catIdx]));

  return (
    <Plot
      data={[
        {
          type: "heatmap",
          z,
          x,
          y,
          colorscale: [
            [0, "#eef4fb"],
            [1, "#1c5cab"],
          ],
          hovertemplate: "%{y} · %{x}: %{z:,.0f}분<extra></extra>",
          texttemplate: "%{z:,.0f}",
          textfont: { size: 11 },
        },
      ]}
      layout={{
        height: 260,
        margin: { t: 10, b: 30, l: 90, r: 10 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "var(--font-family-base)", color: "var(--color-text-primary)" },
      }}
      config={{ displayModeBar: false }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
