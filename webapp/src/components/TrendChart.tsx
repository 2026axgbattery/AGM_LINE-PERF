"use client";

import dynamic from "next/dynamic";
import { movingAverage } from "@/lib/movingAverage";
import { rateStatus } from "@/lib/status";
import { LINE_SHORT_LABEL } from "@/lib/lines";

const Plot = dynamic(() => import("./Plot"), { ssr: false });

export interface TrendChartProps {
  line: string;
  dates: string[];
  rates: number[];
  target: number;
}

// ⑤ 추이: 라인별 일 가동율 + 7일 이동평균 + 목표선 + 목표 미달일 표시 (FR-12).
export function TrendChart({ line, dates, rates, target }: TrendChartProps) {
  const ma = movingAverage(rates, 7);
  const belowIdx = rates
    .map((r, i) => (r < target ? i : -1))
    .filter((i) => i >= 0);

  const monthRate = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : 0;
  const status = rateStatus(monthRate, target);

  return (
    <div className="min-w-0 rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-h3 whitespace-nowrap">AGM 조립 {LINE_SHORT_LABEL[line] ?? line}</span>
        <span
          className="text-caption whitespace-nowrap rounded-full px-3 py-1 font-semibold"
          style={{ color: status.color, backgroundColor: `${status.color}22` }}
        >
          {status.label} · 평균 {(monthRate * 100).toFixed(1)}% · 미달 {belowIdx.length}일
        </span>
      </div>
      <Plot
        data={[
          {
            type: "scatter",
            mode: "lines",
            x: dates,
            y: rates.map((r) => r * 100),
            name: "일 가동율",
            line: { color: "#2a78d6" },
          },
          {
            type: "scatter",
            mode: "lines",
            x: dates,
            y: ma.map((r) => r * 100),
            name: "7일 이동평균",
            line: { color: "#898781", dash: "dash" },
          },
          {
            type: "scatter",
            mode: "markers",
            x: belowIdx.map((i) => dates[i]),
            y: belowIdx.map((i) => rates[i] * 100),
            name: "목표 미달",
            marker: { color: "#d03b3b", size: 7 },
          },
        ]}
        layout={{
          height: 260,
          margin: { t: 36, b: 30, l: 40, r: 10 },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { family: "var(--font-family-base)", color: "var(--color-text-primary)" },
          xaxis: { tickfont: { size: 10 } },
          yaxis: { range: [50, 100] },
          shapes: [
            {
              type: "line",
              xref: "paper",
              x0: 0,
              x1: 1,
              y0: target * 100,
              y1: target * 100,
              line: { color: "#52514e", dash: "dot", width: 1.5 },
            },
          ],
          legend: { orientation: "h", y: -0.2 },
        }}
        config={{ displayModeBar: true, displaylogo: false }}
        style={{ width: "100%" }}
        useResizeHandler
      />
    </div>
  );
}
