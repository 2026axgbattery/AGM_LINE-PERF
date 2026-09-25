import { LINES, LINE_SHORT_LABEL } from "@/lib/lines";

export interface FilterBarProps {
  action: string; // 현재 페이지 경로 (폼 제출 대상)
  months: string[];
  selectedMonth: string; // showAllPeriodOption이 true면 "all"일 수 있음
  showAllPeriodOption?: boolean; // ⑤추이: "전체 기간" 옵션 (FR-12)
  targetPercent?: number; // 있으면 목표 가동율 입력 표시 (FR-8)
  showLineFilter?: boolean; // 있으면 라인 선택 표시 (FR-13)
  selectedLine?: string; // 기본 "all"
  topN?: number; // ④로스: 파레토 TOP N 조정 (FR-11)
}

// 서버 컴포넌트에서 그대로 렌더링되는 순수 GET 폼 — 클라이언트 JS 없이 새로고침만으로 필터를 바꾼다.
export function FilterBar({
  action,
  months,
  selectedMonth,
  showAllPeriodOption,
  targetPercent,
  showLineFilter,
  selectedLine,
  topN,
}: FilterBarProps) {
  return (
    <form className="flex flex-wrap items-end gap-3 text-text-primary" action={action} method="GET">
      <label className="flex flex-col gap-1">
        <span className="text-caption text-text-secondary">기간</span>
        <select
          name="month"
          defaultValue={selectedMonth}
          className="text-body-sm rounded-md border border-border bg-bg-base px-2 py-1.5"
        >
          {showAllPeriodOption && <option value="all">전체 기간</option>}
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      {showLineFilter && (
        <label className="flex flex-col gap-1">
          <span className="text-caption text-text-secondary">라인</span>
          <select
            name="line"
            defaultValue={selectedLine ?? "all"}
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
      )}

      {targetPercent !== undefined && (
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
      )}

      {topN !== undefined && (
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
      )}

      <button type="submit" className="text-button rounded-md bg-accent-primary px-4 py-1.5 text-white">
        적용
      </button>
    </form>
  );
}
