import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { KpiCard } from "@/components/KpiCard";
import { LineStatusCard } from "@/components/LineStatusCard";
import { getAvailableMonths, getKpiSummary, getLineMonthStats } from "@/lib/queries";
import { DEFAULT_TARGET_RATE } from "@/lib/lines";
import { STATUS_COLOR } from "@/lib/status";

interface HomePageProps {
  searchParams: Promise<{ month?: string; target?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const months = getAvailableMonths();

  if (months.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-h1">① 현황판</h1>
        <p className="text-body text-text-secondary">
          아직 적재된 데이터가 없습니다.{" "}
          <Link href="/upload" className="text-accent-secondary underline">
            SMES 원본을 업로드
          </Link>
          하면 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  const selectedMonth = sp.month && months.includes(sp.month) ? sp.month : months[0];
  const targetPercent = Math.min(100, Math.max(1, Number(sp.target) || DEFAULT_TARGET_RATE * 100));
  const target = targetPercent / 100;

  const stats = getLineMonthStats(selectedMonth);
  const kpi = getKpiSummary(selectedMonth, target);
  const belowTargetLabel =
    kpi.totalLineDays > 0 ? `${kpi.belowTargetDays}건 / ${kpi.totalLineDays}` : "-";

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">① 현황판</h1>
          <p className="text-body text-text-secondary">{selectedMonth} · AGM 조립 1~4라인</p>
        </div>
        <FilterBar months={months} selectedMonth={selectedMonth} targetPercent={targetPercent} />
      </div>

      <div className="flex flex-wrap gap-4">
        <KpiCard label="4개 라인 종합 가동율" value={`${(kpi.overallRate * 100).toFixed(1)}%`} />
        <KpiCard label="6대부동 합계" value={`${kpi.sixLossTotal.toLocaleString()}분`} />
        <KpiCard
          label="최저 라인"
          value={kpi.worstLine ? `${kpi.worstLine.line.replace("AGM조립", "")} ${(kpi.worstLine.rate * 100).toFixed(1)}%` : "-"}
          hintColor={STATUS_COLOR.warn}
        />
        <KpiCard label="목표 미달 일수" value={belowTargetLabel} hint="라인×일 기준" />
      </div>

      <div className="flex flex-wrap gap-4">
        {stats.map((stat) => (
          <LineStatusCard key={stat.line} stat={stat} target={target} />
        ))}
      </div>
    </div>
  );
}
