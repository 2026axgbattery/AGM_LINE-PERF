export interface FilterBarProps {
  months: string[];
  selectedMonth: string;
  targetPercent: number; // 0~100
}

// 서버 컴포넌트에서 그대로 렌더링되는 순수 GET 폼 — 클라이언트 JS 없이 새로고침만으로 필터를 바꾼다.
export function FilterBar({ months, selectedMonth, targetPercent }: FilterBarProps) {
  return (
    <form className="flex flex-wrap items-end gap-3 text-text-primary" action="/" method="GET">
      <label className="flex flex-col gap-1">
        <span className="text-caption text-text-secondary">기간</span>
        <select
          name="month"
          defaultValue={selectedMonth}
          className="text-body-sm rounded-md border border-border bg-bg-base px-2 py-1.5"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
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
      <button
        type="submit"
        className="text-button rounded-md bg-accent-primary px-4 py-1.5 text-white"
      >
        적용
      </button>
    </form>
  );
}
