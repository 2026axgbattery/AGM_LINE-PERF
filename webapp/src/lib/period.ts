// ①현황판의 "일별/기간별/월별" 기간 문자열 유틸. period는 "YYYY-MM-DD"(일) 또는 "YYYY-MM"(월).
// Date.toISOString()은 UTC로 변환하면서 로컬 자정을 전날로 밀어낼 수 있어(KST는 UTC+9)
// 쓰지 않고, 로컬 getFullYear/getMonth/getDate로 직접 포맷한다.
function parseDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmt(d: Date, withDay: boolean): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  if (!withDay) return `${y}-${m}`;
  return `${y}-${m}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isDayPeriod(period: string): boolean {
  return period.length === 10;
}

// 날짜 문자열("YYYY-MM-DD")에 delta일을 더한 날짜 문자열을 반환한다.
export function addDays(date: string, delta: number): string {
  const d = parseDate(date);
  d.setDate(d.getDate() + delta);
  return fmt(d, true);
}

// from~to(포함) 사이의 일수(당일 포함) 차이.
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000) + 1;
}

// 같은 단위(일→일, 월→월)의 바로 이전 기간을 반환한다.
export function previousPeriod(period: string): string {
  if (isDayPeriod(period)) return addDays(period, -1);

  const [y, m] = period.split("-").map(Number);
  const date = new Date(y, m - 2, 1); // m-1(0-indexed 이번 달) - 1(전달)
  return fmt(date, false);
}

// 임의 날짜 범위(from~to, 포함)와 같은 길이의 바로 이전 구간을 반환한다.
export function previousRange(from: string, to: string): { from: string; to: string } {
  const length = daysBetween(from, to);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(length - 1));
  return { from: prevFrom, to: prevTo };
}

// 같은 월/일, 1년 전. ③비교분석의 "전년 비교"용 — previousPeriod()는 "바로 이전"만 다루고
// 연 단위는 따로 없어서 추가했다.
export function previousYear(period: string): string {
  if (isDayPeriod(period)) {
    const [y, m, d] = period.split("-").map(Number);
    return fmt(new Date(y - 1, m - 1, d), true);
  }
  const [y, m] = period.split("-").map(Number);
  return fmt(new Date(y - 1, m - 1, 1), false);
}
