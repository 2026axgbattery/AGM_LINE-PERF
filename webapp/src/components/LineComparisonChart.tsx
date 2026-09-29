"use client";

import dynamic from "next/dynamic";
import { LINES, LINE_SHORT_LABEL } from "@/lib/lines";
import { STATUS_COLOR } from "@/lib/status";

const Plot = dynamic(() => import("./AnimatedPlot").then((m) => m.AnimatedPlot), { ssr: false });

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

// 가동율 비교분석 — 라인별 막대 차트로 현재 vs 비교기간(전일/전월/전년) 가동율을 나란히 보여준다.
// rate===1(비가동)인 막대는 높이 0 + "비가동" 텍스트로 표시해, 100%짜리 막대가 마치 완벽한
// 가동인 것처럼 보이지 않게 한다(①현황판의 Gauge와 같은 규칙, lib/status.ts 참고).
// 비교기간 막대는 예전에 var(--color-text-secondary)를 썼는데, Plotly가 bar marker.color를
// SVG fill 속성으로 그려서 CSS 변수가 아예 해석되지 않아(다른 차트들도 전부 리터럴 hex를 쓰는
// 이유) 두 막대 모두 검정으로 렌더링되고 있었다 — 실제 색상 구분이 전혀 안 되는 버그였다.
// 현재 기간은 세방 잉크(짙은 네이비), 비교기간은 세방 그린으로 고정한다 — 처음엔 현재 기간에
// accent-primary(세방 오렌지, #EB3300)를 썼는데 빨간색에 가까워 눈이 아프다는 피드백을 받고
// 바꿨다.
const CURRENT_COLOR = "#1F3742"; // --sebang-ink
const PREVIOUS_COLOR = "#006A76"; // --color-accent-secondary(세방 그린)

export function LineComparisonChart({ current, previous, currentLabel, previousLabel }: LineComparisonChartProps) {
  const x = LINES.map((l) => LINE_SHORT_LABEL[l] ?? l);
  const cur = seriesOf(current, CURRENT_COLOR);
  const prev = seriesOf(previous, PREVIOUS_COLOR);

  return (
    <Plot
      data={[
        // 비교기간(전일/전월/전년) 막대를 먼저 그려서 그룹 안에서 왼쪽(우선)에 오게 한다 —
        // "과거 → 현재" 순서로 읽히도록 배치해달라는 요청.
        {
          type: "bar",
          name: previousLabel,
          x,
          y: prev.y,
          text: prev.text,
          textposition: "outside",
          marker: { color: prev.colors },
        },
        {
          type: "bar",
          name: currentLabel,
          x,
          y: cur.y,
          text: cur.text,
          textposition: "outside",
          marker: { color: cur.colors },
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
