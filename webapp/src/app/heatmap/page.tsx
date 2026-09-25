import { CategoryHeatmap } from "@/components/CategoryHeatmap";
import { ExportLinks } from "@/components/ExportLinks";
import { FilterBar } from "@/components/FilterBar";
import { HeatmapChart } from "@/components/HeatmapChart";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { getAvailableMonths, getHeatmapData } from "@/lib/queries";

interface HeatmapPageProps {
  searchParams: Promise<{ month?: string; line?: string }>;
}

export default async function HeatmapPage({ searchParams }: HeatmapPageProps) {
  const sp = await searchParams;
  const months = getAvailableMonths();
  if (months.length === 0) return <PlaceholderPage title="③ 히트맵" milestone="업로드 후 표시" />;

  const selectedMonth = sp.month && months.includes(sp.month) ? sp.month : months[0];
  const selectedLine = sp.line ?? "all";
  const data = getHeatmapData(selectedMonth, selectedLine);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">③ 히트맵</h1>
          <p className="text-body text-text-secondary">
            {selectedMonth} · 라인×일 가동율 — 칸을 클릭하면 그날 부동 상세가 나옵니다
          </p>
        </div>
        <FilterBar
          action="/heatmap"
          months={months}
          selectedMonth={selectedMonth}
          showLineFilter
          selectedLine={selectedLine}
        />
      </div>

      <ExportLinks month={selectedMonth} line={selectedLine} />

      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <div className="text-h3 mb-2">일자별 라인 가동율 (%)</div>
        <HeatmapChart
          lines={data.lines}
          dates={data.dates}
          rates={data.rates}
          overallRates={data.overallRates}
        />
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <div className="text-h3 mb-2">부동 유형 × 라인 (월 합계, 분)</div>
        <CategoryHeatmap categoryTotals={data.categoryTotals} />
      </div>
    </div>
  );
}
