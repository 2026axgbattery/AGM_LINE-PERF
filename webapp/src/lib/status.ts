// 가동율 상태 신호등 기준 (scripts/dashboard/gen_mockups.py의 status()와 동일한 규칙).
// 정상 ≥ target, 주의 ≥ target-0.05, 그 아래는 경고. target은 화면에서 조정 가능해야 한다(PRD FR-8).
export const STATUS_COLOR = {
  good: "#0ca30c",
  warn: "#fab219",
  critical: "#d03b3b",
} as const;

export type RateStatus = { level: "good" | "warn" | "critical"; color: string; label: string };

export function rateStatus(rate: number, target: number): RateStatus {
  if (rate >= target) return { level: "good", color: STATUS_COLOR.good, label: "정상" };
  if (rate >= target - 0.05) return { level: "warn", color: STATUS_COLOR.warn, label: "주의" };
  return { level: "critical", color: STATUS_COLOR.critical, label: "경고" };
}
