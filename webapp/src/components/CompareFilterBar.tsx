import Link from "next/link";

export type CompareMode = "day" | "month" | "year";

export interface CompareFilterBarProps {
  mode: CompareMode;
  selectedDate: string; // mode="day"
  selectedMonth: string; // mode="month"|"year"
  minDate: string;
  maxDate: string;
}

const MODE_LABEL: Record<CompareMode, string> = { day: "전일 비교", month: "전월 비교", year: "전년 비교" };

// ③비교분석 전용 필터 — HomeFilterBar.tsx와 같은 이유로 분리(다른 화면 FilterBar에 영향 안 주려고).
export function CompareFilterBar({ mode, selectedDate, selectedMonth, minDate, maxDate }: CompareFilterBarProps) {
  const minMonth = minDate.slice(0, 7);
  const maxMonth = maxDate.slice(0, 7);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex overflow-hidden rounded-md border border-border">
        {(["day", "month", "year"] as const).map((m) => (
          <Link
            key={m}
            href={`/compare?mode=${m}`}
            className={
              "text-body-sm px-3 py-1.5 transition-colors " +
              (mode === m ? "bg-accent-primary text-white" : "text-text-primary hover:bg-bg-base")
            }
          >
            {MODE_LABEL[m]}
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-3 text-text-primary" action="/compare" method="GET">
        <input type="hidden" name="mode" value={mode} />
        {mode === "day" ? (
          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-secondary">날짜</span>
            <input
              type="date"
              name="period"
              defaultValue={selectedDate}
              min={minDate}
              max={maxDate}
              className="text-body-sm rounded-md border border-border bg-bg-base px-2 py-1.5"
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-caption text-text-secondary">월</span>
            <input
              type="month"
              name="period"
              defaultValue={selectedMonth}
              min={minMonth}
              max={maxMonth}
              className="text-body-sm rounded-md border border-border bg-bg-base px-2 py-1.5"
            />
          </label>
        )}
        <button type="submit" className="text-button rounded-md bg-accent-primary px-4 py-1.5 text-white">
          적용
        </button>
      </form>
    </div>
  );
}
