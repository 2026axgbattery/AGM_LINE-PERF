"use client";

import dynamic from "next/dynamic";
import { LOSS_CATEGORY_COLOR } from "@/lib/lossCategories";

const Plot = dynamic(() => import("./AnimatedPlot").then((m) => m.AnimatedPlot), { ssr: false });

const TOTAL_COLOR = "#52514e";

export interface WaterfallChartProps {
  categories: { label: string; minutes: number }[]; // 큰 순서
}

// 6대부동 분석 — 6대부동 누적(계단식 막대, 분). Plotly의 waterfall 트레이스는 increasing/decreasing/
// totals 단위로만 색을 줄 수 있어 부동유형별로 다른 색을 못 준다 — 대신 bar 트레이스를
// base(누적 시작점)로 직접 계단처럼 쌓아서, 유형별 색(LOSS_CATEGORY_COLOR, 계획가동시간
// 구성 막대와 동일한 색)을 개별로 지정한다. 대신 waterfall 특유의 연결선(connector)은 없다.
export function WaterfallChart({ categories }: WaterfallChartProps) {
  const total = categories.reduce((s, c) => s + c.minutes, 0);

  const bases = categories.reduce<number[]>((acc, c, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + categories[i - 1].minutes);
    return acc;
  }, []);

  const x = [...categories.map((c) => c.label), "합계"];
  const y = [...categories.map((c) => c.minutes), total];
  const base = [...bases, 0];
  const colors = [...categories.map((c) => LOSS_CATEGORY_COLOR[c.label] ?? TOTAL_COLOR), TOTAL_COLOR];

  return (
    <Plot
      data={[
        {
          type: "bar",
          x,
          y,
          base,
          marker: { color: colors },
          text: y.map((v) => v.toLocaleString(undefined, { maximumFractionDigits: 0 })),
          textposition: "outside",
          hovertemplate: "%{x}: %{y:,.0f}분<extra></extra>",
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
      config={{ displayModeBar: true, displaylogo: false }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
