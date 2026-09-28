import { ExportLinks } from "@/components/ExportLinks";
import { PeriodFilterBar, type PeriodMode } from "@/components/PeriodFilterBar";
import { PlaceholderPage } from "@/components/PlaceholderPage";
import { TrendChart } from "@/components/TrendChart";
import { LINES, LINE_SHORT_LABEL, DEFAULT_TARGET_RATE } from "@/lib/lines";
import { getAvailableDates, getAvailableMonths, getTrendSeries, type Period } from "@/lib/queries";

interface TrendPageProps {
  searchParams: Promise<{ mode?: string; period?: string; from?: string; to?: string; line?: string; target?: string }>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export default async function TrendPage({ searchParams }: TrendPageProps) {
  const sp = await searchParams;
  const dates = getAvailableDates();
  const months = getAvailableMonths();
  if (dates.length === 0) return <PlaceholderPage title="가동율 추이" milestone="업로드 후 표시" />;

  const minDate = dates[dates.length - 1];
  const maxDate = dates[0];
  const mode: PeriodMode = sp.mode === "month" ? "month" : sp.mode === "range" ? "range" : "day";

  const selectedDate = sp.period && DATE_RE.test(sp.period) ? sp.period : maxDate;
  const selectedMonth = sp.period && MONTH_RE.test(sp.period) ? sp.period : months[0];
  let rangeFrom = sp.from && DATE_RE.test(sp.from) ? sp.from : minDate;
  let rangeTo = sp.to && DATE_RE.test(sp.to) ? sp.to : maxDate;
  if (rangeFrom > rangeTo) [rangeFrom, rangeTo] = [rangeTo, rangeFrom];

  const selectedLine = sp.line ?? "all";
  const targetPercent = Math.min(100, Math.max(1, Number(sp.target) || DEFAULT_TARGET_RATE * 100));
  const target = targetPercent / 100;

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
  const exportMonth = mode === "month" ? selectedMonth : "all";

  const series = getTrendSeries(period, selectedLine);

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">가동율 추이</h1>
          <p className="text-body text-text-secondary">{periodText} · 일 가동율 · 7일 이동평균 · 목표선</p>
        </div>
        <PeriodFilterBar
          basePath="/trend"
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
            </>
          }
        />
      </div>

      <ExportLinks month={exportMonth} line={selectedLine} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {series.map((s) => (
          <TrendChart key={s.line} line={s.line} dates={s.dates} rates={s.rates} target={target} />
        ))}
      </div>
    </div>
  );
}
