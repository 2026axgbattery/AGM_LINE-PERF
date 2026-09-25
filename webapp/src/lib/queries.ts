import { sql } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { allocation, lineDay, uploads } from "@/db/schema";
import { LINES } from "./lines";
import { LOSS_LABELS } from "./lossCategories";

export const ALL_LINES = "all" as const;
export type LineFilter = string | undefined; // undefined 또는 "all" = 전체 라인 (FR-13)

function monthClause(month: string) {
  // date는 'YYYY-MM-DD' — 앞 7자리로 월 필터링
  return sql`substr(${lineDay.date}, 1, 7) = ${month}`;
}

function selectedLines(line: LineFilter): readonly string[] {
  return !line || line === ALL_LINES ? LINES : [line];
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

// ── ③ 히트맵 ──────────────────────────────────────────────────
export interface HeatmapData {
  lines: string[];
  dates: string[];
  rates: Record<string, number[]>; // line -> dates 순서의 시간가동율
  overallRates: number[] | null; // 라인 전체 선택일 때만 종합 라인 (dates 순서)
  categoryTotals: { line: string; values: number[] }[]; // values는 LOSS_LABELS 순서 (월 합계, 분)
}

export function getHeatmapData(month: string, line: LineFilter): HeatmapData {
  const lines = selectedLines(line);

  const dates = db
    .select({ date: lineDay.date })
    .from(lineDay)
    .where(monthClause(month))
    .groupBy(lineDay.date)
    .orderBy(lineDay.date)
    .all()
    .map((r) => r.date);

  const rates: Record<string, number[]> = {};
  for (const l of lines) {
    const rows = db
      .select({ date: lineDay.date, rate: lineDay.operatingRate })
      .from(lineDay)
      .where(sql`${lineDay.line} = ${l} and ${monthClause(month)}`)
      .orderBy(lineDay.date)
      .all();
    const byDate = new Map(rows.map((r) => [r.date, r.rate]));
    rates[l] = dates.map((d) => byDate.get(d) ?? 0);
  }

  let overallRates: number[] | null = null;
  if (!line || line === ALL_LINES) {
    const rows = db
      .select({
        date: lineDay.date,
        planMinutes: sql<number>`sum(${lineDay.planMinutes})`,
        operatingMinutes: sql<number>`sum(${lineDay.operatingMinutes})`,
      })
      .from(lineDay)
      .where(monthClause(month))
      .groupBy(lineDay.date)
      .orderBy(lineDay.date)
      .all();
    const byDate = new Map(rows.map((r) => [r.date, r.planMinutes > 0 ? r.operatingMinutes / r.planMinutes : 0]));
    overallRates = dates.map((d) => byDate.get(d) ?? 0);
  }

  const totalsByLine = new Map(getLineMonthTotals(month).map((t) => [t.line, t]));
  const categoryTotals = lines.map((l) => {
    const t = totalsByLine.get(l);
    return {
      line: l,
      values: LOSS_LABELS.map(({ key }) => t?.[key] ?? 0),
    };
  });

  return { lines: [...lines], dates, rates, overallRates, categoryTotals };
}

// ── ③ 드릴다운: 특정 라인·일자의 부동 상세 (FR-10) ──────────────
export interface AllocationDetail {
  lossCategory: string;
  lossDetail: string;
  detailText: string;
  minutesAllocated: number;
  allocationRatio: number;
  isManualExcluded: boolean;
}

export function getDayDetail(date: string, line: string): AllocationDetail[] {
  return db
    .select({
      lossCategory: allocation.lossCategory,
      lossDetail: allocation.lossDetail,
      detailText: allocation.detailText,
      minutesAllocated: allocation.minutesAllocated,
      allocationRatio: allocation.allocationRatio,
      isManualExcluded: allocation.isManualExcluded,
    })
    .from(allocation)
    .where(sql`${allocation.date} = ${date} and ${allocation.line} = ${line}`)
    .orderBy(sql`${allocation.minutesAllocated} desc`)
    .all();
}

// ── ④ 로스 워터폴/파레토 ──────────────────────────────────────
export interface LossBreakdown {
  planMinutes: number;
  operatingMinutes: number;
  categories: { label: string; minutes: number }[]; // 큰 순서
}

export function getLossBreakdown(month: string, line: LineFilter): LossBreakdown {
  const lines = new Set(selectedLines(line));
  const rows = getLineMonthTotals(month).filter((t) => lines.has(t.line));

  const planMinutes = rows.reduce((s, r) => s + r.planMinutes, 0);
  const operatingMinutes = rows.reduce((s, r) => s + r.operatingMinutes, 0);
  const categories = LOSS_LABELS.map(({ key, label }) => ({
    label,
    minutes: rows.reduce((s, r) => s + (r[key] ?? 0), 0),
  })).sort((a, b) => b.minutes - a.minutes);

  return { planMinutes, operatingMinutes, categories };
}

export interface ParetoItem {
  detail: string;
  minutes: number;
  cumulativeRatio: number;
}

export function getPareto(month: string, line: LineFilter, topN: number): ParetoItem[] {
  const rows = db
    .select({ detail: allocation.lossDetail, minutes: sql<number>`sum(${allocation.minutesAllocated})` })
    .from(allocation)
    .where(
      sql`substr(${allocation.date}, 1, 7) = ${month} and ${allocation.isManualExcluded} = 0 and ${lineClauseFor(allocation.line, line)}`,
    )
    .groupBy(allocation.lossDetail)
    .orderBy(sql`sum(${allocation.minutesAllocated}) desc`)
    .all();

  const total = rows.reduce((s, r) => s + r.minutes, 0) || 1;
  let cum = 0;
  return rows.slice(0, topN).map((r) => {
    cum += r.minutes;
    return { detail: r.detail, minutes: r.minutes, cumulativeRatio: cum / total };
  });
}

function lineClauseFor(col: SQLiteColumn, line: LineFilter) {
  return !line || line === ALL_LINES ? sql`1=1` : sql`${col} = ${line}`;
}

// ── ⑤ 추이 ─────────────────────────────────────────────────
export interface TrendSeries {
  line: string;
  dates: string[];
  rates: number[];
}

// monthOrAll: 특정 "YYYY-MM" 또는 "all"(적재된 전체 기간, FR-12)
export function getTrendSeries(monthOrAll: string, line: LineFilter): TrendSeries[] {
  const lines = selectedLines(line);
  const where =
    monthOrAll === "all"
      ? sql`1=1`
      : sql`substr(${lineDay.date}, 1, 7) = ${monthOrAll}`;

  return lines.map((l) => {
    const rows = db
      .select({ date: lineDay.date, rate: lineDay.operatingRate })
      .from(lineDay)
      .where(sql`${lineDay.line} = ${l} and ${where}`)
      .orderBy(lineDay.date)
      .all();
    return { line: l, dates: rows.map((r) => r.date), rates: rows.map((r) => r.rate) };
  });
}

// ── 내보내기 (FR-14) — 화면에 쓰는 것과 같은 조건으로 원본에 가까운 행을 그대로 낸다 ──
// monthOrAll: 특정 "YYYY-MM" 또는 "all"(⑤추이의 전체 기간 내보내기용)
export function getLineDayRows(monthOrAll: string, line: LineFilter) {
  const monthWhere = monthOrAll === "all" ? sql`1=1` : monthClause(monthOrAll);
  return db
    .select()
    .from(lineDay)
    .where(sql`${monthWhere} and ${lineClauseFor(lineDay.line, line)}`)
    .orderBy(lineDay.line, lineDay.date)
    .all();
}

export function getAllocationRows(monthOrAll: string, line: LineFilter) {
  const monthWhere = monthOrAll === "all" ? sql`1=1` : sql`substr(${allocation.date}, 1, 7) = ${monthOrAll}`;
  return db
    .select()
    .from(allocation)
    .where(sql`${monthWhere} and ${lineClauseFor(allocation.line, line)}`)
    .orderBy(allocation.date, allocation.line)
    .all();
}

// ── /upload 화면 ──────────────────────────────────────────────
export function getUploadHistory(limit = 10) {
  return db.select().from(uploads).orderBy(sql`${uploads.id} desc`).limit(limit).all();
}
