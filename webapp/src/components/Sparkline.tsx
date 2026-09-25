"use client";

import dynamic from "next/dynamic";
import { STATUS_COLOR, rateStatus } from "@/lib/status";

const Plot = dynamic(() => import("./Plot"), { ssr: false });

export interface SparklineProps {
  dailyRates: { date: string; rate: number }[];
  target: number;
}

// ①현황판 라인 카드의 일자별 가동율 미니 막대 (scripts/dashboard/gen_mockups.py의 spark()와 같은 의도).
export function Sparkline({ dailyRates, target }: SparklineProps) {
  const x = dailyRates.map((d) => d.date.slice(8, 10)); // 'DD'만
  const y = dailyRates.map((d) => d.rate * 100);
  const colors = dailyRates.map((d) => rateStatus(d.rate, target).color);

  return (
    <Plot
      data={[
        {
          type: "bar",
          x,
          y,
          marker: { color: colors },
          hovertemplate: "%{x}일: %{y:.1f}%<extra></extra>",
        },
      ]}
      layout={{
        width: 280,
        height: 70,
        margin: { t: 4, b: 16, l: 0, r: 0 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        xaxis: { showticklabels: false, showgrid: false, zeroline: false },
        yaxis: { visible: false, range: [50, 100] },
        shapes: [
          {
            type: "line",
            xref: "paper",
            x0: 0,
            x1: 1,
            y0: target * 100,
            y1: target * 100,
            line: { color: STATUS_COLOR.good, width: 1, dash: "dot" },
          },
        ],
      }}
      config={{ displayModeBar: false, responsive: true }}
    />
  );
}
