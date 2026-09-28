"use client";

import dynamic from "next/dynamic";
import { LINES, LINE_SHORT_LABEL } from "@/lib/lines";
import { STATUS_COLOR } from "@/lib/status";

const Plot = dynamic(() => import("./Plot"), { ssr: false });

export interface ComparisonPoint {
  line: string;
  rate: number; // 0~1
  planMinutes: number; // 0이면 그 기간에 해당 라인 데이터 자체가 없었다는 뜻(getLineMonthStats 참고)
}

export interface LineComparisonChartProps {
  current: ComparisonPoint[];
  previous: ComparisonPoint[];
  currentLabel: string;
  previousLabel: string;
}

function seriesOf(points: ComparisonPoint[], color: string) {
  const byLine = new Map(points.map((p) => [p.line, p]));
  const y: number[] = [];
  const text: string[] = [];
  const colors: string[] = [];
  for (const line of LINES) {
    const p = byLine.get(line);
    if (!p || p.planMinutes === 0) {
      y.push(0);
      text.push("데이터 없음");
      colors.push(STATUS_COLOR.noData);
    } else if (p.rate === 1) {
      y.push(0);
      text.push("비가동");
      colors.push(STATUS_COLOR.noData);
    } else {
      y.push(p.rate * 100);
      text.push(`${(p.rate * 100).toFixed(1)}%`);
      colors.push(color);
    }
  }
  return { y, text, colors };
}

// ③비교분석 — 라인별 막대 차트로 현재 vs 비교기간(전일/전월/전년) 가동율을 나란히 보여준다.
// rate===1(비가동)인 막대는 높이 0 + "비가동" 텍스트로 표시해, 100%짜리 막대가 마치 완벽한
// 가동인 것처럼 보이지 않게 한다(①현황판의 Gauge와 같은 규칙, lib/status.ts 참고).
export function LineComparisonChart({ current, previous, currentLabel, previousLabel }: LineComparisonChartProps) {
  const x = LINES.map((l) => LINE_SHORT_LABEL[l] ?? l);
  const cur = seriesOf(current, "var(--color-accent-primary)");
  const prev = seriesOf(previous, "var(--color-text-secondary)");

  return (
    <Plot
      data={[
        {
          type: "bar",
          name: currentLabel,
          x,
          y: cur.y,
          text: cur.text,
          textposition: "outside",
          marker: { color: cur.colors },
        },
        {
          type: "bar",
          name: previousLabel,
          x,
          y: prev.y,
          text: prev.text,
          textposition: "outside",
          marker: { color: prev.colors },
        },
      ]}
      layout={{
        height: 380,
        barmode: "group",
        yaxis: { range: [0, 110], ticksuffix: "%", title: { text: "시간가동율" } },
        margin: { t: 30, b: 40, l: 50, r: 20 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "var(--font-family-base)", color: "var(--color-text-primary)" },
        legend: { orientation: "h", y: -0.15 },
      }}
      config={{ displayModeBar: false }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
