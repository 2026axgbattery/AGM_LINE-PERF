import Link from "next/link";
import { cookies } from "next/headers";
import { PeriodFilterBar, type PeriodMode } from "@/components/PeriodFilterBar";
import { HomeFilterPersist } from "@/components/HomeFilterPersist";
import { KpiCard } from "@/components/KpiCard";
import { LineStatusCard } from "@/components/LineStatusCard";
import { DEFAULT_TARGET_RATE } from "@/lib/lines";
import { previousPeriod, previousRange } from "@/lib/period";
import { getAvailableDates, getAvailableMonths, getKpiSummary, getLineMonthStats, type Period } from "@/lib/queries";
import { rateStatus, STATUS_COLOR } from "@/lib/status";
import { decodeHomeFilterCookie, HOME_FILTER_COOKIE } from "@/lib/homeFilterCookie";

interface HomePageProps {
  searchParams: Promise<{ mode?: string; period?: string; from?: string; to?: string; target?: string }>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export default async function Home({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const saved = decodeHomeFilterCookie(cookieStore.get(HOME_FILTER_COOKIE)?.value);
  // 쿼리스트링에 값이 있으면(사용자가 지금 막 필터를 바꿨거나 링크를 눌렀으면) 그걸 그대로 쓰고,
  // 없으면(사이드바에서 "①현황판"으로 그냥 돌아온 경우) 마지막으로 저장된 쿠키 값을 대신 쓴다.
  const eff = {
    mode: sp.mode ?? saved.mode,
    period: sp.period ?? saved.period,
    from: sp.from ?? saved.from,
    to: sp.to ?? saved.to,
    target: sp.target ?? saved.target,
  };
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
  const mode: PeriodMode = eff.mode === "month" ? "month" : eff.mode === "range" ? "range" : "day";

  const targetPercent = Math.min(100, Math.max(1, Number(eff.target) || DEFAULT_TARGET_RATE * 100));
  const target = targetPercent / 100;

  let period: Period;
  let prevPeriod: Period;
  let periodText: string;
  let deltaLabel: string;
  const selectedDate = eff.period && DATE_RE.test(eff.period) ? eff.period : maxDate;
  const selectedMonth = eff.period && MONTH_RE.test(eff.period) ? eff.period : months[0];
  let rangeFrom = eff.from && DATE_RE.test(eff.from) ? eff.from : minDate;
  let rangeTo = eff.to && DATE_RE.test(eff.to) ? eff.to : maxDate;
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
      <HomeFilterPersist
        mode={mode}
        period={mode === "day" ? selectedDate : mode === "month" ? selectedMonth : undefined}
        from={rangeFrom}
        to={rangeTo}
        target={targetPercent}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">① 현황판</h1>
          <p className="text-body text-text-secondary">{periodText} · AGM 조립 1~4라인</p>
        </div>
        <PeriodFilterBar
          basePath="/"
          mode={mode}
          selectedDate={selectedDate}
          selectedMonth={selectedMonth}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          minDate={minDate}
          maxDate={maxDate}
          extraFields={
            <label className="flex flex-col gap-1">
              <span className="text-caption text-text-secondary">목표 가동율(%)</span>
              <input
                type="number"
                name="target"
                min={1}
                max={100}
                step={1}
                defaultValue={targetPercent}
                className="text-body-sm w-24 rounded-md border border-border bg-bg-base px-2 py-1.5"
              />
            </label>
          }
        />
      </div>

      {noData ? (
        <p className="text-body text-text-secondary">이 기간에는 데이터가 없습니다. 다른 날짜를 선택해 보세요.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              compact
              label="4개 라인 종합 가동율"
              value={overallIsNoData ? "비가동" : `${(kpi.overallRate * 100).toFixed(1)}%`}
              valueColor={overallIsNoData ? STATUS_COLOR.noData : undefined}
            />
            <KpiCard compact label="6대부동 합계" value={`${kpi.sixLossTotal.toLocaleString()}분`} />
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* 가동율 산출식 참고 — 예전엔 헤더 옆에 있었는데, 항상 눈에 보일 필요는 없는 참고
          자료라 스크롤해야 보이는 맨 아래로 내렸다(사용자 확정 사항). */}
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
  );
}
