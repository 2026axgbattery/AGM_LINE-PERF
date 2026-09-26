import { ExportLinks } from "@/components/ExportLinks";
import { FilterBar } from "@/components/FilterBar";
import { LossCompositionBar } from "@/components/LossCompositionBar";
import { ParetoChart } from "@/components/ParetoChart";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { WaterfallChart } from "@/components/WaterfallChart";
import { getAvailableMonths, getLossBreakdown, getPareto } from "@/lib/queries";

interface LossPageProps {
  searchParams: Promise<{ month?: string; line?: string; topn?: string }>;
}

export default async function LossPage({ searchParams }: LossPageProps) {
  const sp = await searchParams;
  const months = getAvailableMonths();
  if (months.length === 0) return <PlaceholderPage title="④ 로스" milestone="업로드 후 표시" />;

  const selectedMonth = sp.month && months.includes(sp.month) ? sp.month : months[0];
  const selectedLine = sp.line ?? "all";
  const topN = Math.min(30, Math.max(3, Number(sp.topn) || 10));

  const breakdown = getLossBreakdown(selectedMonth, selectedLine);
  const pareto = getPareto(selectedMonth, selectedLine, topN);
  const totalLoss = breakdown.categories.reduce((s, c) => s + c.minutes, 0);
  const plan = breakdown.planMinutes || 1;

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">④ 로스</h1>
          <p className="text-body text-text-secondary">
            {selectedMonth} · 계획가동시간이 어떤 부동으로 얼마나 깎였는지
          </p>
        </div>
        <FilterBar
          action="/loss"
          months={months}
          selectedMonth={selectedMonth}
          showLineFilter
          selectedLine={selectedLine}
          topN={topN}
        />
      </div>

      <ExportLinks month={selectedMonth} line={selectedLine} />

      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <div className="text-h3 mb-2">계획가동시간 구성</div>
        <LossCompositionBar operatingMinutes={breakdown.operatingMinutes} categories={breakdown.categories} />
        <p className="text-caption text-text-secondary">
          계획가동시간 {plan.toLocaleString()}분 · 6대부동 {totalLoss.toLocaleString()}분 (
          {((totalLoss / plan) * 100).toFixed(1)}%)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-border bg-bg-surface p-4">
          <div className="text-h3 mb-2">6대부동 누적 (워터폴, 분)</div>
          <WaterfallChart categories={breakdown.categories} />
        </div>
        <div className="min-w-0 rounded-lg border border-border bg-bg-surface p-4">
          <div className="text-h3 mb-2">부동 원인 파레토 TOP {topN}</div>
          {pareto.length > 0 ? (
            <ParetoChart items={pareto} />
          ) : (
            <p className="text-body-sm text-text-secondary">해당 조건의 부동 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
