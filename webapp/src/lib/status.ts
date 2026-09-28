// 가동율 상태 신호등 기준 (scripts/dashboard/gen_mockups.py의 status()와 동일한 규칙).
// 정상 ≥ target, 주의 ≥ target-0.05, 그 아래는 경고. target은 화면에서 조정 가능해야 한다(PRD FR-8).
export const STATUS_COLOR = {
  good: "#0ca30c",
  warn: "#fab219",
  critical: "#d03b3b",
  noData: "#9ca3af",
} as const;

export type RateStatus = { level: "good" | "warn" | "critical" | "noData"; color: string; label: string };

// 가동율 100%(6대부동 0분)는 사용자 확정 사항상 실제로는 있을 수 없는 값 — 그 라인/기간의
// 부동 데이터가 아예 없다는 신호로 본다. 그래서 "정상"으로 표시하지 않고 회색 "비가동"으로
// 구분한다(rate는 operatingMinutes/planMinutes라 정수 합산에서 나온 값이 그대로 1이 되므로
// 부동 실수 오차 걱정 없이 `=== 1`로 판정해도 된다).
export function rateStatus(rate: number, target: number): RateStatus {
  if (rate === 1) return { level: "noData", color: STATUS_COLOR.noData, label: "비가동" };
  if (rate >= target) return { level: "good", color: STATUS_COLOR.good, label: "정상" };
  if (rate >= target - 0.05) return { level: "warn", color: STATUS_COLOR.warn, label: "주의" };
  return { level: "critical", color: STATUS_COLOR.critical, label: "경고" };
}
