import { sql } from "drizzle-orm";
import { db } from "@/db";
import { lineDay } from "@/db/schema";
import { LINES } from "./lines";

function monthClause(month: string) {
  // date는 'YYYY-MM-DD' — 앞 7자리로 월 필터링
  return sql`substr(${lineDay.date}, 1, 7) = ${month}`;
}

// DB에 적재된 월 목록 (최신월 먼저). 지금은 보통 1개월치만 있지만 여러 달이 쌓이면 그대로 늘어난다.
export function getAvailableMonths(): string[] {
  const rows = db
    .select({ month: sql<string>`substr(${lineDay.date}, 1, 7)`.as("month") })
    .from(lineDay)
    .groupBy(sql`substr(${lineDay.date}, 1, 7)`)
    .orderBy(sql`substr(${lineDay.date}, 1, 7) desc`)
    .all();
  return rows.map((r) => r.month);
}

export interface LineMonthStat {
  line: string;
  rate: number; // 월 시간가동율
  sixLossTotal: number;
  planMinutes: number;
  operatingMinutes: number;
  lastDate: string;
  lastRate: number;
  dailyRates: { date: string; rate: number }[];
  topLosses: { label: string; minutes: number }[];
}

export interface KpiSummary {
  month: string;
  overallRate: number;
  sixLossTotal: number;
  worstLine: { line: string; rate: number } | null;
  belowTargetDays: number;
  totalLineDays: number;
}

// 월 합계(라인별 6대부동 유형 분해 포함). config.SIX_LOSSES와 이름·순서를 맞춘다.
function getLineMonthTotals(month: string) {
  return db
    .select({
      line: lineDay.line,
      planMinutes: sql<number>`sum(${lineDay.planMinutes})`,
      operatingMinutes: sql<number>`sum(${lineDay.operatingMinutes})`,
      sixLossTotal: sql<number>`sum(${lineDay.sixLossTotal})`,
      productionLoss: sql<number>`sum(${lineDay.productionLoss})`,
      equipmentLoss: sql<number>`sum(${lineDay.equipmentLoss})`,
      materialLoss: sql<number>`sum(${lineDay.materialLoss})`,
      managementLoss: sql<number>`sum(${lineDay.managementLoss})`,
      lineImbalanceLoss: sql<number>`sum(${lineDay.lineImbalanceLoss})`,
      materialChangeLoss: sql<number>`sum(${lineDay.materialChangeLoss})`,
    })
    .from(lineDay)
    .where(monthClause(month))
    .groupBy(lineDay.line)
    .all();
}

type LineMonthTotal = ReturnType<typeof getLineMonthTotals>[number];

function topLossesOf(t: LineMonthTotal | undefined): { label: string; minutes: number }[] {
  if (!t) return [];
  return [
    { label: "생산부동", minutes: t.productionLoss },
    { label: "설비부동", minutes: t.equipmentLoss },
    { label: "자재부동", minutes: t.materialLoss },
    { label: "관리부동", minutes: t.managementLoss },
    { label: "라인언밸런스", minutes: t.lineImbalanceLoss },
    { label: "부자재교체", minutes: t.materialChangeLoss },
  ]
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3);
}

export function getLineMonthStats(month: string): LineMonthStat[] {
  const byLine = new Map(getLineMonthTotals(month).map((t) => [t.line, t]));

  return LINES.map((line): LineMonthStat => {
    const t = byLine.get(line);
    const daily = db
      .select({ date: lineDay.date, rate: lineDay.operatingRate })
      .from(lineDay)
      .where(sql`${lineDay.line} = ${line} and ${monthClause(month)}`)
      .orderBy(lineDay.date)
      .all();
    const last = daily.at(-1);

    return {
      line,
      rate: t && t.planMinutes > 0 ? Math.max(0, t.operatingMinutes / t.planMinutes) : 0,
      sixLossTotal: t?.sixLossTotal ?? 0,
      planMinutes: t?.planMinutes ?? 0,
      operatingMinutes: t?.operatingMinutes ?? 0,
      lastDate: last?.date ?? "",
      lastRate: last?.rate ?? 0,
      dailyRates: daily,
      topLosses: topLossesOf(t),
    };
  });
}

export function getKpiSummary(month: string, target: number): KpiSummary {
  const totalRow = db
    .select({
      planMinutes: sql<number>`sum(${lineDay.planMinutes})`,
      operatingMinutes: sql<number>`sum(${lineDay.operatingMinutes})`,
      sixLossTotal: sql<number>`sum(${lineDay.sixLossTotal})`,
      totalLineDays: sql<number>`count(*)`,
      belowTargetDays: sql<number>`sum(case when ${lineDay.operatingRate} < ${target} then 1 else 0 end)`,
    })
    .from(lineDay)
    .where(monthClause(month))
    .get();

  const worst = getLineMonthTotals(month)
    .map((l) => ({ line: l.line, rate: l.planMinutes > 0 ? l.operatingMinutes / l.planMinutes : 0 }))
    .sort((a, b) => a.rate - b.rate)[0];

  return {
    month,
    overallRate:
      totalRow && totalRow.planMinutes > 0 ? totalRow.operatingMinutes / totalRow.planMinutes : 0,
    sixLossTotal: totalRow?.sixLossTotal ?? 0,
    worstLine: worst ?? null,
    belowTargetDays: totalRow?.belowTargetDays ?? 0,
    totalLineDays: totalRow?.totalLineDays ?? 0,
  };
}
