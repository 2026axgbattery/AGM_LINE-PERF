import Link from "next/link";

export type HomeMode = "day" | "range" | "month";

export interface HomeFilterBarProps {
  mode: HomeMode;
  selectedDate: string; // mode="day"
  selectedMonth: string; // mode="month"
  rangeFrom: string; // mode="range"
  rangeTo: string;
  minDate: string; // 데이터가 있는 가장 이른 날짜 — 달력 입력의 min/max로 써서 빈 연도로 헤매지 않게 함
  maxDate: string;
  targetPercent: number;
}

const MODE_LABEL: Record<HomeMode, string> = { day: "일별", range: "기간별", month: "월별" };

// ①현황판 전용 필터 — 일별/기간별/월별 토글 + (달력 입력으로) 기간 선택 + 목표 가동율.
// 다른 화면(③④⑤)이 쓰는 FilterBar.tsx와 별도로 둔 이유: 그쪽은 항상 "월(YYYY-MM)"만
// 다루는 <select> 구조라, 날짜/범위 선택까지 얹으면 공용 컴포넌트가 복잡해지고 기존
// 화면에 영향을 줄 위험이 있어 분리했다. <select>로 날짜를 나열하면 데이터가 몇 년치
// 쌓였을 때 스크롤이 감당 안 돼서(실제 지적받음), 브라우저 기본 달력 위젯을 그대로 쓰는
// <input type="date">/<input type="month">로 바꿨다 — 클릭 한 번으로 달력이 뜬다.
export function HomeFilterBar({
  mode,
  selectedDate,
  selectedMonth,
  rangeFrom,
  rangeTo,
  minDate,
  maxDate,
  targetPercent,
}: HomeFilterBarProps) {
  const minMonth = minDate.slice(0, 7);
  const maxMonth = maxDate.slice(0, 7);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex overflow-hidden rounded-md border border-border">
        {(["day", "range", "month"] as const).map((m) => (
          <Link
            key={m}
            href={`/?mode=${m}`}
            className={
              "text-body-sm px-3 py-1.5 transition-colors " +
              (mode === m ? "bg-accent-primary text-white" : "text-text-primary hover:bg-bg-base")
            }
          >
            {MODE_LABEL[m]}
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-3 text-text-primary" action="/" method="GET">
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

        <button type="submit" className="text-button rounded-md bg-accent-primary px-4 py-1.5 text-white">
          적용
        </button>
      </form>
    </div>
  );
}
