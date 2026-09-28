import type { ReactNode } from "react";
import Link from "next/link";

export type PeriodMode = "day" | "range" | "month";

export interface PeriodFilterBarProps {
  basePath: string; // 폼 제출·모드 토글 대상 경로 ("/", "/loss", "/trend")
  mode: PeriodMode;
  selectedDate: string; // mode="day"
  selectedMonth: string; // mode="month"
  rangeFrom: string; // mode="range"
  rangeTo: string;
  minDate: string; // 데이터가 있는 가장 이른 날짜 — 달력 입력의 min/max
  maxDate: string;
  extraFields?: ReactNode; // 화면별 추가 필터(라인 선택, 목표 가동율, 파레토 TOP N 등) — 적용 버튼 앞에 그대로 끼워 넣는다
}

const MODE_LABEL: Record<PeriodMode, string> = { day: "일별", range: "기간별", month: "월별" };

// ①현황판·6대부동 분석·가동율 추이가 공유하는 일별/기간별/월별 필터.
// 달력 입력(<input type="date"/"month">)을 쓴다 — 데이터가 몇 년치 쌓였을 때 <select> 목록이
// 감당 안 되기 때문(HomeFilterBar였을 때부터의 결정, 화면이 늘어나며 이름만 일반화함).
export function PeriodFilterBar({
  basePath,
  mode,
  selectedDate,
  selectedMonth,
  rangeFrom,
  rangeTo,
  minDate,
  maxDate,
  extraFields,
}: PeriodFilterBarProps) {
  const minMonth = minDate.slice(0, 7);
  const maxMonth = maxDate.slice(0, 7);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex overflow-hidden rounded-md border border-border">
        {(["day", "range", "month"] as const).map((m) => (
          <Link
            key={m}
            href={`${basePath}?mode=${m}`}
            className={
              "text-body-sm px-3 py-1.5 transition-colors " +
              (mode === m ? "bg-accent-primary text-white" : "text-text-primary hover:bg-bg-base")
            }
          >
            {MODE_LABEL[m]}
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-3 text-text-primary" action={basePath} method="GET">
        <input type="hidden" name="mode" value={mode} />

        {mode === "day" && (
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
        )}

        {mode === "range" && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-text-secondary">시작일</span>
              <input
                type="date"
                name="from"
                defaultValue={rangeFrom}
                min={minDate}
                max={maxDate}
                className="text-body-sm rounded-md border border-border bg-bg-base px-2 py-1.5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-caption text-text-secondary">종료일</span>
              <input
                type="date"
                name="to"
                defaultValue={rangeTo}
                min={minDate}
                max={maxDate}
                className="text-body-sm rounded-md border border-border bg-bg-base px-2 py-1.5"
              />
            </label>
          </>
        )}

        {mode === "month" && (
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

        {extraFields}

        <button type="submit" className="text-button rounded-md bg-accent-primary px-4 py-1.5 text-white">
          적용
        </button>
      </form>
    </div>
  );
}
