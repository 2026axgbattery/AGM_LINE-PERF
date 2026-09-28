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

// ①현황판의 일별/기간별/월별 토글이 쓰는 기간 표현. 문자열이면 "YYYY-MM"(월 전체) 또는
// "YYYY-MM-DD"(하루), 객체면 from~to(포함) 임의 날짜 범위.
export type Period = string | { from: string; to: string };

// 길이로만 구분하는 건 다른 화면(getAvailableMonths 등)의 기존 월 전용 동작에 영향
// 없이 getLineMonthStats/getKpiSummary/getTopLossDetails만 확장하기 위함이다.
function periodClauseCol(col: SQLiteColumn, period: Period) {
  if (typeof period !== "string") {
    return sql`${col} between ${period.from} and ${period.to}`;
  }
  return period.length === 10 ? sql`${col} = ${period}` : sql`substr(${col}, 1, 7) = ${period}`;
}

function periodClause(period: Period) {
  return periodClauseCol(lineDay.date, period);
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

// DB에 적재된 날짜 목록 (최신일 먼저) — ①현황판의 일별 보기 선택지용.
export function getAvailableDates(): string[] {
  const rows = db
    .select({ date: lineDay.date })
    .from(lineDay)
    .groupBy(lineDay.date)
    .orderBy(sql`${lineDay.date} desc`)
    .all();
  return rows.map((r) => r.date);
}

export interface TopLossDetail {
  detail: string;
  minutes: number;
}

export interface TopLossItem {
  label: string;
  minutes: number;
  details: TopLossDetail[]; // 이 부동유형 안에서 가장 큰 부동내역 상위 3건 (호버 표시용). 없으면 빈 배열.
}

export interface LineMonthStat {
  line: string;
  rate: number; // 기간 시간가동율
  sixLossTotal: number;
  planMinutes: number;
  operatingMinutes: number;
  lastDate: string;
  lastRate: number;
  topLosses: TopLossItem[];
}

// 부동유형(예: "설비부동") 안에서 부동내역(엑셀 "부동내역" 컬럼) 기준 가장 큰 상위 N건.
// getPareto와 동일하게 수동작업(isManualExcluded)은 제외한다 — lineDay의 부동유형 합계 자체가
// 이미 수동작업을 뺀 값이라 여기서도 맞춰야 두 숫자가 어긋나지 않는다.
function getTopLossDetails(period: Period, line: string, lossCategory: string, limit = 3): TopLossDetail[] {
  return db
    .select({ detail: allocation.lossDetail, minutes: sql<number>`sum(${allocation.minutesAllocated})` })
    .from(allocation)
    .where(
      sql`${allocation.line} = ${line} and ${allocation.lossCategory} = ${lossCategory} and ${allocation.isManualExcluded} = 0 and ${periodClauseCol(allocation.date, period)}`,
    )
    .groupBy(allocation.lossDetail)
    .orderBy(sql`sum(${allocation.minutesAllocated}) desc`)
    .limit(limit)
    .all();
}

export interface KpiSummary {
  period: Period;
  overallRate: number;
  sixLossTotal: number;
  worstLine: { line: string; rate: number } | null;
  belowTargetDays: number;
  totalLineDays: number;
}

// 기간 합계(라인별 6대부동 유형 분해 포함). config.SIX_LOSSES와 이름·순서를 맞춘다.
// period 형태에 따라 그 달 전체/하루/임의 범위를 집계한다(periodClause 참고).
function getLineMonthTotals(period: Period) {
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
    .where(periodClause(period))
    .groupBy(lineDay.line)
    .all();
}

type LineMonthTotal = ReturnType<typeof getLineMonthTotals>[number];

function topLossesOf(period: Period, line: string, t: LineMonthTotal | undefined): TopLossItem[] {
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
    .slice(0, 3)
    .map((c) => ({ ...c, details: c.minutes > 0 ? getTopLossDetails(period, line, c.label, 3) : [] }));
}

export function getLineMonthStats(period: Period): LineMonthStat[] {
  const byLine = new Map(getLineMonthTotals(period).map((t) => [t.line, t]));

  return LINES.map((line): LineMonthStat => {
    const t = byLine.get(line);
    const last = db
      .select({ date: lineDay.date, rate: lineDay.operatingRate })
      .from(lineDay)
      .where(sql`${lineDay.line} = ${line} and ${periodClause(period)}`)
      .orderBy(sql`${lineDay.date} desc`)
      .limit(1)
      .get();

    return {
      line,
      rate: t && t.planMinutes > 0 ? Math.max(0, t.operatingMinutes / t.planMinutes) : 0,
      sixLossTotal: t?.sixLossTotal ?? 0,
      planMinutes: t?.planMinutes ?? 0,
      operatingMinutes: t?.operatingMinutes ?? 0,
      lastDate: last?.date ?? "",
      lastRate: last?.rate ?? 0,
      topLosses: topLossesOf(period, line, t),
    };
  });
}

export function getKpiSummary(period: Period, target: number): KpiSummary {
  const totalRow = db
    .select({
      planMinutes: sql<number>`sum(${lineDay.planMinutes})`,
      operatingMinutes: sql<number>`sum(${lineDay.operatingMinutes})`,
      sixLossTotal: sql<number>`sum(${lineDay.sixLossTotal})`,
      totalLineDays: sql<number>`count(*)`,
      belowTargetDays: sql<number>`sum(case when ${lineDay.operatingRate} < ${target} then 1 else 0 end)`,
    })
    .from(lineDay)
    .where(periodClause(period))
    .get();

  const worst = getLineMonthTotals(period)
    .map((l) => ({ line: l.line, rate: l.planMinutes > 0 ? l.operatingMinutes / l.planMinutes : 0 }))
    .sort((a, b) => a.rate - b.rate)[0];

  return {
    period,
    overallRate:
      totalRow && totalRow.planMinutes > 0 ? totalRow.operatingMinutes / totalRow.planMinutes : 0,
    sixLossTotal: totalRow?.sixLossTotal ?? 0,
    worstLine: worst ?? null,
    belowTargetDays: totalRow?.belowTargetDays ?? 0,
    totalLineDays: totalRow?.totalLineDays ?? 0,
  };
}

// ── ④ 로스 워터폴/파레토 ──────────────────────────────────────
export interface LossBreakdown {
  planMinutes: number;
  operatingMinutes: number;
  categories: { label: string; minutes: number }[]; // 큰 순서
}

export function getLossBreakdown(period: Period, line: LineFilter): LossBreakdown {
  const lines = new Set(selectedLines(line));
  const rows = getLineMonthTotals(period).filter((t) => lines.has(t.line));

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
  ratio: number; // 전체 부동(topN이 아니라 그 조건의 전체 부동내역 합계) 대비 이 항목의 비중 (0~1)
  cumulativeRatio: number;
}

export function getPareto(period: Period, line: LineFilter, topN: number): ParetoItem[] {
  const rows = db
    .select({ detail: allocation.lossDetail, minutes: sql<number>`sum(${allocation.minutesAllocated})` })
    .from(allocation)
    .where(
      sql`${periodClauseCol(allocation.date, period)} and ${allocation.isManualExcluded} = 0 and ${lineClauseFor(allocation.line, line)}`,
    )
    .groupBy(allocation.lossDetail)
    .orderBy(sql`sum(${allocation.minutesAllocated}) desc`)
    .all();

  const total = rows.reduce((s, r) => s + r.minutes, 0) || 1;
  let cum = 0;
  return rows.slice(0, topN).map((r) => {
    cum += r.minutes;
    return { detail: r.detail, minutes: r.minutes, ratio: r.minutes / total, cumulativeRatio: cum / total };
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

// ①현황판·④6대부동 분석과 같은 일별/기간별/월별 Period를 그대로 받는다
// ("전체 기간"이 필요하면 기간별 모드에서 최소~최대 날짜를 그대로 선택하면 된다).
export function getTrendSeries(period: Period, line: LineFilter): TrendSeries[] {
  const lines = selectedLines(line);

  return lines.map((l) => {
    const rows = db
      .select({ date: lineDay.date, rate: lineDay.operatingRate })
      .from(lineDay)
      .where(sql`${lineDay.line} = ${l} and ${periodClause(period)}`)
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
