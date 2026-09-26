import { ExportLinks } from "@/components/ExportLinks";
import { FilterBar } from "@/components/FilterBar";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { TrendChart } from "@/components/TrendChart";
import { getAvailableMonths, getTrendSeries } from "@/lib/queries";
import { DEFAULT_TARGET_RATE } from "@/lib/lines";

interface TrendPageProps {
  searchParams: Promise<{ month?: string; line?: string; target?: string }>;
}

export default async function TrendPage({ searchParams }: TrendPageProps) {
  const sp = await searchParams;
  const months = getAvailableMonths();
  if (months.length === 0) return <PlaceholderPage title="⑤ 추이" milestone="업로드 후 표시" />;

  const selectedMonth = sp.month === "all" || (sp.month && months.includes(sp.month)) ? sp.month! : months[0];
  const selectedLine = sp.line ?? "all";
  const targetPercent = Math.min(100, Math.max(1, Number(sp.target) || DEFAULT_TARGET_RATE * 100));
  const target = targetPercent / 100;

  const series = getTrendSeries(selectedMonth, selectedLine);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">⑤ 추이</h1>
          <p className="text-body text-text-secondary">
            {selectedMonth === "all" ? "전체 기간" : selectedMonth} · 일 가동율 · 7일 이동평균 · 목표선
          </p>
        </div>
        <FilterBar
          action="/trend"
          months={months}
          selectedMonth={selectedMonth}
          showAllPeriodOption
          showLineFilter
          selectedLine={selectedLine}
          targetPercent={targetPercent}
        />
      </div>

      <ExportLinks month={selectedMonth} line={selectedLine} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {series.map((s) => (
          <TrendChart key={s.line} line={s.line} dates={s.dates} rates={s.rates} target={target} />
        ))}
      </div>
    </div>
  );
}
