import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { allocation, lineDay } from "@/db/schema";
import { OUTPUT_DIR } from "./paths";

function toIsoDate(raw: string): string {
  // pandas to_csv가 datetime을 "2026-07-01" 또는 "2026-07-01 00:00:00"으로 낼 수 있어 앞 10자만 취한다.
  return raw.slice(0, 10);
}

function num(v: string): number {
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`숫자로 변환할 수 없는 값: "${v}"`);
  return n;
}

interface LineDayRow {
  line: string;
  date: string;
  productionLoss: number;
  equipmentLoss: number;
  materialLoss: number;
  managementLoss: number;
  lineImbalanceLoss: number;
  materialChangeLoss: number;
  sixLossTotal: number;
  planMinutes: number;
  operatingMinutes: number;
  operatingRate: number;
  warning: string | null;
}

interface AllocationRow {
  date: string;
  line: string;
  lossCategory: string;
  lossDetail: string;
  detailText: string;
  allocationRatio: number;
  minutesAllocated: number;
  isManualExcluded: boolean;
}

function parseLineDayCsv(csvText: string): LineDayRow[] {
  const records: Record<string, string>[] = parse(csvText, { columns: true, skip_empty_lines: true });
  return records.map((r) => ({
    line: r["라인"],
    date: toIsoDate(r["일자"]),
    productionLoss: num(r["생산부동"]),
    equipmentLoss: num(r["설비부동"]),
    materialLoss: num(r["자재부동"]),
    managementLoss: num(r["관리부동"]),
    lineImbalanceLoss: num(r["라인언밸런스"]),
    materialChangeLoss: num(r["부자재교체"]),
    sixLossTotal: num(r["6대부동합계"]),
    planMinutes: num(r["계획가동시간"]),
    operatingMinutes: num(r["가동시간"]),
    operatingRate: num(r["시간가동율"]),
    warning: r["확인"]?.trim() ? r["확인"].trim() : null,
  }));
}

function parseAllocationCsv(csvText: string): AllocationRow[] {
  const records: Record<string, string>[] = parse(csvText, { columns: true, skip_empty_lines: true });
  return records
    .filter((r) => r["반영구분"] === "가동율반영" || r["반영구분"] === "수동작업(제외)")
    .map((r) => ({
      date: toIsoDate(r["일자"]),
      line: r["라인"],
      lossCategory: r["부동유형"],
      lossDetail: r["부동내역"],
      detailText: r["세부내역"],
      allocationRatio: num(r["배분율"]),
      minutesAllocated: num(r["배분시간분"]),
      isManualExcluded: r["반영구분"] === "수동작업(제외)",
    }));
}

export interface IngestResult {
  lineDayRows: number;
  allocationRows: number;
  dates: string[];
  warnings: { line: string; date: string; warning: string }[];
}

// output/agm_line_day.csv, agm_allocation.csv(scripts/export_data.py 산출물)를 읽어
// 그대로 SQLite에 옮겨 담는다. 가동율 재계산은 하지 않는다(TECH 5장, CLAUDE.md 로직 이중화 금지 원칙).
// 같은 날짜의 기존 행은 지우고 다시 넣어 재업로드 시 덮어쓰기가 되게 한다(PRD FR-3).
export function ingestFromOutput(): IngestResult {
  const lineDayCsvPath = path.join(OUTPUT_DIR, "agm_line_day.csv");
  const allocationCsvPath = path.join(OUTPUT_DIR, "agm_allocation.csv");

  const lineDayRows = parseLineDayCsv(fs.readFileSync(lineDayCsvPath, "utf-8"));
  const allocationRows = parseAllocationCsv(fs.readFileSync(allocationCsvPath, "utf-8"));

  const dates = [...new Set(lineDayRows.map((r) => r.date))].sort();

  db.transaction((tx) => {
    if (dates.length > 0) {
      tx.delete(lineDay).where(inArray(lineDay.date, dates)).run();
      tx.delete(allocation).where(inArray(allocation.date, dates)).run();
    }
    for (const row of lineDayRows) {
      tx.insert(lineDay).values(row).run();
    }
    for (const row of allocationRows) {
      tx.insert(allocation).values(row).run();
    }
  });

  const warnings = lineDayRows
    .filter((r) => r.warning)
    .map((r) => ({ line: r.line, date: r.date, warning: r.warning as string }));

  return { lineDayRows: lineDayRows.length, allocationRows: allocationRows.length, dates, warnings };
}
