import Link from "next/link";
import { CompareFilterBar, type CompareMode } from "@/components/CompareFilterBar";
import { LineComparisonChart } from "@/components/LineComparisonChart";
import { previousPeriod, previousYear } from "@/lib/period";
import { getAvailableDates, getAvailableMonths, getLineMonthStats } from "@/lib/queries";

interface ComparePageProps {
  searchParams: Promise<{ mode?: string; period?: string }>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const sp = await searchParams;
  const dates = getAvailableDates();
  const months = getAvailableMonths();

  if (dates.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <h1 className="text-h1">③ 비교분석</h1>
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

  const minDate = dates[dates.length - 1];
  const maxDate = dates[0];
  const mode: CompareMode = sp.mode === "month" ? "month" : sp.mode === "year" ? "year" : "day";

  const selectedDate = sp.period && DATE_RE.test(sp.period) ? sp.period : maxDate;
  const selectedMonth = sp.period && MONTH_RE.test(sp.period) ? sp.period : months[0];

  let period: string;
  let prevPeriod: string;
  let currentLabel: string;
  let previousLabel: string;

  if (mode === "day") {
    period = selectedDate;
    prevPeriod = previousPeriod(selectedDate);
    currentLabel = period;
    previousLabel = `전일(${prevPeriod})`;
  } else if (mode === "year") {
    period = selectedMonth;
    prevPeriod = previousYear(selectedMonth);
    currentLabel = period;
    previousLabel = `전년(${prevPeriod})`;
  } else {
    period = selectedMonth;
    prevPeriod = previousPeriod(selectedMonth);
    currentLabel = period;
    previousLabel = `전월(${prevPeriod})`;
  }

  const currentStats = getLineMonthStats(period);
  const previousStats = getLineMonthStats(prevPeriod);
  const hasCurrentData = currentStats.some((s) => s.planMinutes > 0);
  const hasPreviousData = previousStats.some((s) => s.planMinutes > 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">③ 비교분석</h1>
          <p className="text-body text-text-secondary">
            {currentLabel} vs {previousLabel} · AGM 조립 1~4라인
          </p>
        </div>
        <CompareFilterBar mode={mode} selectedDate={selectedDate} selectedMonth={selectedMonth} minDate={minDate} maxDate={maxDate} />
      </div>

      {!hasCurrentData ? (
        <p className="text-body text-text-secondary">현재 기간({currentLabel})에는 데이터가 없습니다. 다른 날짜/월을 선택해 보세요.</p>
      ) : (
        <div className="rounded-lg border border-border bg-bg-surface p-4">
          <div className="text-h3 mb-2">라인별 시간가동율 비교</div>
          {!hasPreviousData && (
            <p className="text-body-sm mb-2 text-text-secondary">
              비교 데이터 없음 — {previousLabel}에는 적재된 데이터가 없습니다.
            </p>
          )}
          <LineComparisonChart
            current={currentStats.map((s) => ({ line: s.line, rate: s.rate, planMinutes: s.planMinutes }))}
            previous={previousStats.map((s) => ({ line: s.line, rate: s.rate, planMinutes: s.planMinutes }))}
            currentLabel={currentLabel}
            previousLabel={previousLabel}
          />
        </div>
      )}
    </div>
  );
}
