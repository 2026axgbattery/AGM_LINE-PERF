import Link from "next/link";
import { HomeFilterBar, type HomeMode } from "@/components/HomeFilterBar";
import { KpiCard } from "@/components/KpiCard";
import { LineStatusCard } from "@/components/LineStatusCard";
import { DEFAULT_TARGET_RATE } from "@/lib/lines";
import { previousPeriod, previousRange } from "@/lib/period";
import { getAvailableDates, getAvailableMonths, getKpiSummary, getLineMonthStats, type Period } from "@/lib/queries";
import { rateStatus, STATUS_COLOR } from "@/lib/status";

interface HomePageProps {
  searchParams: Promise<{ mode?: string; period?: string; from?: string; to?: string; target?: string }>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export default async function Home({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const dates = getAvailableDates();
  const months = getAvailableMonths();

  if (dates.length === 0) {
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

  const minDate = dates[dates.length - 1];
  const maxDate = dates[0];
  const mode: HomeMode = sp.mode === "month" ? "month" : sp.mode === "range" ? "range" : "day";

  const targetPercent = Math.min(100, Math.max(1, Number(sp.target) || DEFAULT_TARGET_RATE * 100));
  const target = targetPercent / 100;

  let period: Period;
  let prevPeriod: Period;
  let periodText: string;
  let deltaLabel: string;
  const selectedDate = sp.period && DATE_RE.test(sp.period) ? sp.period : maxDate;
  const selectedMonth = sp.period && MONTH_RE.test(sp.period) ? sp.period : months[0];
  let rangeFrom = sp.from && DATE_RE.test(sp.from) ? sp.from : minDate;
  let rangeTo = sp.to && DATE_RE.test(sp.to) ? sp.to : maxDate;
  if (rangeFrom > rangeTo) [rangeFrom, rangeTo] = [rangeTo, rangeFrom];

  if (mode === "day") {
    period = selectedDate;
    prevPeriod = previousPeriod(selectedDate);
    periodText = selectedDate;
    deltaLabel = "전일 대비";
  } else if (mode === "range") {
    period = { from: rangeFrom, to: rangeTo };
    prevPeriod = previousRange(rangeFrom, rangeTo);
    periodText = rangeFrom === rangeTo ? rangeFrom : `${rangeFrom} ~ ${rangeTo}`;
    deltaLabel = "직전 기간 대비";
  } else {
    period = selectedMonth;
    prevPeriod = previousPeriod(selectedMonth);
    periodText = selectedMonth;
    deltaLabel = "전월 대비";
  }

  const stats = getLineMonthStats(period);
  const kpi = getKpiSummary(period, target);
  const noData = kpi.totalLineDays === 0;

  const prevKpi = getKpiSummary(prevPeriod, target);
  const hasPrev = prevKpi.totalLineDays > 0;
  const deltaPp = hasPrev ? (kpi.overallRate - prevKpi.overallRate) * 100 : null;
  const prevPeriodText =
    typeof prevPeriod === "string" ? prevPeriod : prevPeriod.from === prevPeriod.to ? prevPeriod.from : `${prevPeriod.from}~${prevPeriod.to}`;

  // rate===1(6대부동 0분)은 실제로 있을 수 없는 값이라 "비가동"(데이터 없음)으로 본다 —
  // 정상 달성으로 세지 않는다(사용자 확정 사항).
  const overallStatus = rateStatus(kpi.overallRate, target);
  const overallIsNoData = overallStatus.level === "noData";
  const achievedLines = stats.filter((s) => s.rate !== 1 && s.rate >= target).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-h1">① 현황판</h1>
            <p className="text-body text-text-secondary">{periodText} · AGM 조립 1~4라인</p>
          </div>
          <HomeFilterBar
            mode={mode}
            selectedDate={selectedDate}
            selectedMonth={selectedMonth}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            minDate={minDate}
            maxDate={maxDate}
            targetPercent={targetPercent}
          />
        </div>

        <aside className="max-w-xs rounded-md border border-border bg-bg-surface p-3">
          <div className="text-[0.6875rem] font-medium break-keep text-text-secondary">가동율 산출식 (참고)</div>
          <p className="mt-1 text-[0.6875rem] leading-relaxed break-keep text-text-secondary">
            라인 가동율 = (계획가동시간 − 6대부동시간) ÷ 계획가동시간
            <br />
            계획가동시간 = 1,320분/일 (3조2교대)
            <br />
            6대부동 = 생산·설비·자재·관리·라인언밸런스·부자재교체
          </p>
        </aside>
      </div>

      {noData ? (
        <p className="text-body text-text-secondary">이 기간에는 데이터가 없습니다. 다른 날짜를 선택해 보세요.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="4개 라인 종합 가동율"
              value={overallIsNoData ? "비가동" : `${(kpi.overallRate * 100).toFixed(1)}%`}
              valueColor={overallIsNoData ? STATUS_COLOR.noData : undefined}
            />
            <KpiCard label="6대부동 합계" value={`${kpi.sixLossTotal.toLocaleString()}분`} />
            <KpiCard
              label={deltaLabel}
              value={
                overallIsNoData
                  ? "-"
                  : deltaPp === null
                    ? "-"
                    : `${deltaPp >= 0 ? "▲" : "▼"} ${Math.abs(deltaPp).toFixed(1)}%p`
              }
              hint={
                overallIsNoData
                  ? "현재 기간 데이터 없음(비가동)"
                  : hasPrev
                    ? `${prevPeriodText}: ${(prevKpi.overallRate * 100).toFixed(1)}%`
                    : "비교할 이전 기간 데이터 없음"
              }
              hintColor={overallIsNoData || deltaPp === null ? undefined : deltaPp >= 0 ? STATUS_COLOR.good : STATUS_COLOR.critical}
            />
            <KpiCard
              label="목표 달성 라인"
              value={`${achievedLines} / ${stats.length}`}
              hint={`목표 ${targetPercent}% 기준`}
              hintColor={achievedLines === stats.length ? STATUS_COLOR.good : STATUS_COLOR.warn}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {stats.map((stat) => (
              <LineStatusCard
                key={stat.line}
                stat={stat}
                target={target}
                periodLabel={mode === "month" ? "월" : mode === "day" ? "일" : "기간"}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
