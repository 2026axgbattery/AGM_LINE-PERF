"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LINE_SHORT_LABEL } from "@/lib/lines";
import type { AllocationDetail } from "@/lib/queries";

const Plot = dynamic(() => import("./Plot"), { ssr: false });

export interface HeatmapChartProps {
  lines: string[];
  dates: string[];
  rates: Record<string, number[]>;
  overallRates: number[] | null;
}

interface DrilldownState {
  line: string;
  date: string;
  loading: boolean;
  items: AllocationDetail[] | null;
  error: string | null;
}

export function HeatmapChart({ lines, dates, rates, overallRates }: HeatmapChartProps) {
  const [drill, setDrill] = useState<DrilldownState | null>(null);

  const yLabels = [...lines.map((l) => LINE_SHORT_LABEL[l] ?? l), ...(overallRates ? ["종합"] : [])];
  const z = [...lines.map((l) => rates[l].map((r) => r * 100)), ...(overallRates ? [overallRates.map((r) => r * 100)] : [])];
  const xLabels = dates.map((d) => d.slice(8, 10));

  async function handleClick(e: { points: { x: string | number; pointIndex: [number, number] }[] }) {
    const point = e.points[0];
    if (!point) return;
    const [rowIndex, colIndex] = point.pointIndex;
    const line = lines[rowIndex];
    if (!line) return; // 종합 행 클릭은 드릴다운 대상 없음
    const date = dates[colIndex];

    setDrill({ line, date, loading: true, items: null, error: null });
    try {
      const res = await fetch(`/api/day-detail?date=${date}&line=${encodeURIComponent(line)}`);
      if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
      const items: AllocationDetail[] = await res.json();
      setDrill({ line, date, loading: false, items, error: null });
    } catch (err) {
      setDrill({
        line,
        date,
        loading: false,
        items: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Plot
        data={[
          {
            type: "heatmap",
            z,
            x: xLabels,
            y: yLabels,
            zmin: 70,
            zmax: 100,
            colorscale: [
              [0, "#d03b3b"],
              [0.5, "#fab219"],
              [1, "#0ca30c"],
            ],
            hovertemplate: "%{y} %{x}일: %{z:.1f}%<extra></extra>",
            colorbar: { title: { text: "%" } },
          },
        ]}
        layout={{
          height: 120 + yLabels.length * 34,
          margin: { t: 10, b: 30, l: 50, r: 10 },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { family: "var(--font-family-base)", color: "var(--color-text-primary)" },
          xaxis: { tickfont: { size: 10 } },
          yaxis: { tickfont: { size: 12 } },
        }}
        config={{ displayModeBar: true, displaylogo: false }}
        onClick={handleClick}
        style={{ width: "100%" }}
        useResizeHandler
      />

      {drill && (
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <div className="text-h3">
            {LINE_SHORT_LABEL[drill.line] ?? drill.line} · {drill.date} 부동 상세
          </div>
          {drill.loading && <div className="text-body-sm mt-2 text-text-secondary">불러오는 중...</div>}
          {drill.error && <div className="text-body-sm mt-2 text-danger">{drill.error}</div>}
          {drill.items && drill.items.length === 0 && (
            <div className="text-body-sm mt-2 text-text-secondary">해당일 부동 내역이 없습니다.</div>
          )}
          {drill.items && drill.items.length > 0 && (
            <table className="text-body-sm mt-3 w-full border-collapse">
              <thead>
                <tr className="text-caption text-left text-text-secondary">
                  <th className="pb-1 pr-3">부동유형</th>
                  <th className="pb-1 pr-3">부동내역</th>
                  <th className="pb-1 pr-3">세부내역</th>
                  <th className="pb-1 pr-3 text-right">배분(분)</th>
                  <th className="pb-1 text-right">반영</th>
                </tr>
              </thead>
              <tbody>
                {drill.items.map((item, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1 pr-3">{item.lossCategory}</td>
                    <td className="py-1 pr-3">{item.lossDetail}</td>
                    <td className="py-1 pr-3 text-text-secondary">{item.detailText}</td>
                    <td className="py-1 pr-3 text-right">{item.minutesAllocated.toLocaleString()}</td>
                    <td className="py-1 text-right">
                      {item.isManualExcluded ? "수동작업(제외)" : "가동율반영"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
