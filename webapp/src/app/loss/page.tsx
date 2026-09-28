import { ExportLinks } from "@/components/ExportLinks";
import { PeriodFilterBar, type PeriodMode } from "@/components/PeriodFilterBar";
import { LossCompositionBar } from "@/components/LossCompositionBar";
import { ParetoChart } from "@/components/ParetoChart";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { WaterfallChart } from "@/components/WaterfallChart";
import { LINES, LINE_SHORT_LABEL } from "@/lib/lines";
import { getAvailableDates, getAvailableMonths, getLossBreakdown, getPareto, type Period } from "@/lib/queries";

interface LossPageProps {
  searchParams: Promise<{ mode?: string; period?: string; from?: string; to?: string; line?: string; topn?: string }>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export default async function LossPage({ searchParams }: LossPageProps) {
  const sp = await searchParams;
  const dates = getAvailableDates();
  const months = getAvailableMonths();
  if (dates.length === 0) return <PlaceholderPage title="6대부동 분석" milestone="업로드 후 표시" />;

  const minDate = dates[dates.length - 1];
  const maxDate = dates[0];
  const mode: PeriodMode = sp.mode === "month" ? "month" : sp.mode === "range" ? "range" : "day";

  const selectedDate = sp.period && DATE_RE.test(sp.period) ? sp.period : maxDate;
  const selectedMonth = sp.period && MONTH_RE.test(sp.period) ? sp.period : months[0];
  let rangeFrom = sp.from && DATE_RE.test(sp.from) ? sp.from : minDate;
  let rangeTo = sp.to && DATE_RE.test(sp.to) ? sp.to : maxDate;
  if (rangeFrom > rangeTo) [rangeFrom, rangeTo] = [rangeTo, rangeFrom];

  const selectedLine = sp.line ?? "all";
  const topN = Math.min(30, Math.max(3, Number(sp.topn) || 10));

  let period: Period;
  let periodText: string;
  if (mode === "day") {
    period = selectedDate;
    periodText = selectedDate;
  } else if (mode === "range") {
    period = { from: rangeFrom, to: rangeTo };
    periodText = rangeFrom === rangeTo ? rangeFrom : `${rangeFrom} ~ ${rangeTo}`;
  } else {
    period = selectedMonth;
    periodText = selectedMonth;
  }
  // ExportLinks/CSV는 아직 "월(또는 전체)" 단위만 지원한다 — 일별/기간별 모드에서는 특정 월을
  // 하나로 못 집어내니 전체 기간을 내보내도록 한다.
  const exportMonth = mode === "month" ? selectedMonth : "all";

  const breakdown = getLossBreakdown(period, selectedLine);
  const pareto = getPareto(period, selectedLine, topN);
  const totalLoss = breakdown.categories.reduce((s, c) => s + c.minutes, 0);
  const plan = breakdown.planMinutes || 1;

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">6대부동 분석</h1>
          <p className="text-body text-text-secondary">{periodText} · 계획가동시간이 어떤 부동으로 얼마나 깎였는지</p>
        </div>
        <PeriodFilterBar
          basePath="/loss"
          mode={mode}
          selectedDate={selectedDate}
          selectedMonth={selectedMonth}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          minDate={minDate}
          maxDate={maxDate}
          extraFields={
            <>
              <label className="flex flex-col gap-1">
                <span className="text-caption text-text-secondary">라인</span>
                <select
                  name="line"
                  defaultValue={selectedLine}
                  className="text-body-sm rounded-md border border-border bg-bg-base px-2 py-1.5"
                >
                  <option value="all">전체</option>
                  {LINES.map((l) => (
                    <option key={l} value={l}>
                      {LINE_SHORT_LABEL[l]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption text-text-secondary">파레토 TOP N</span>
                <input
                  type="number"
                  name="topn"
                  min={3}
                  max={30}
                  step={1}
                  defaultValue={topN}
                  className="text-body-sm w-20 rounded-md border border-border bg-bg-base px-2 py-1.5"
                />
              </label>
            </>
          }
        />
      </div>

      <ExportLinks month={exportMonth} line={selectedLine} />

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
          <div className="text-h3 mb-2">6대부동 누적</div>
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
