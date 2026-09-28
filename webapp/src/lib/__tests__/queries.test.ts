import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { allocation, lineDay } from "@/db/schema";
import { ingestFromOutput } from "../ingest";
import { OUTPUT_DIR } from "../paths";
import { getAvailableMonths, getKpiSummary, getLineMonthStats, getLossBreakdown, getPareto } from "../queries";
import { ALLOCATION_CSV, LINE_DAY_CSV } from "./fixtures";

beforeEach(() => {
  db.delete(lineDay).run();
  db.delete(allocation).run();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "agm_line_day.csv"), LINE_DAY_CSV);
  fs.writeFileSync(path.join(OUTPUT_DIR, "agm_allocation.csv"), ALLOCATION_CSV);
  ingestFromOutput();
});

describe("getAvailableMonths", () => {
  it("적재된 월을 반환한다", () => {
    expect(getAvailableMonths()).toEqual(["2026-01"]);
  });
});

describe("getKpiSummary", () => {
  it("종합 가동율·6대부동 합계·최저 라인·목표미달 일수를 집계한다", () => {
    const kpi = getKpiSummary("2026-01", 0.9);
    expect(kpi.overallRate).toBeCloseTo((1285 + 0 + 1320 + 1270) / (1320 * 4), 6);
    expect(kpi.sixLossTotal).toBe(35 + 2000 + 0 + 50);
    expect(kpi.totalLineDays).toBe(4);
    expect(kpi.belowTargetDays).toBe(1); // 1라인 1/2 (가동율 0)만 90% 미달
    expect(kpi.worstLine?.line).toBe("AGM조립1라인");
    expect(kpi.worstLine?.rate).toBeCloseTo(1285 / 2640, 6);
  });
});

describe("getLineMonthStats", () => {
  it("라인별 월 가동율·부동합계·TOP3를 계산한다 (analysis.py 값을 재계산하지 않고 합산만)", () => {
    const stats = getLineMonthStats("2026-01");
    const line1 = stats.find((s) => s.line === "AGM조립1라인")!;
    const line2 = stats.find((s) => s.line === "AGM조립2라인")!;

    expect(line1.rate).toBeCloseTo(1285 / 2640, 6);
    expect(line1.sixLossTotal).toBe(2035);
    expect(line1.topLosses).toEqual([
      { label: "설비부동", minutes: 2020 },
      { label: "생산부동", minutes: 10 },
      { label: "부자재교체", minutes: 5 },
    ]);

    expect(line2.rate).toBeCloseTo(2590 / 2640, 6);
    expect(line2.topLosses[0]).toEqual({ label: "관리부동", minutes: 50 });
  });
});

describe("getLossBreakdown", () => {
  it("전체 라인 합계 기준으로 계획/가동/부동유형별 분을 낸다", () => {
    const b = getLossBreakdown("2026-01", "all");
    expect(b.planMinutes).toBe(1320 * 4);
    expect(b.operatingMinutes).toBe(1285 + 0 + 1320 + 1270);
    expect(b.categories[0]).toEqual({ label: "설비부동", minutes: 2020 });
    expect(b.categories.find((c) => c.label === "관리부동")).toEqual({ label: "관리부동", minutes: 50 });
  });

  it("라인 필터를 주면 그 라인만 집계한다", () => {
    const b = getLossBreakdown("2026-01", "AGM조립2라인");
    expect(b.planMinutes).toBe(1320 * 2);
    expect(b.categories.find((c) => c.label === "관리부동")?.minutes).toBe(50);
    expect(b.categories.find((c) => c.label === "설비부동")?.minutes).toBe(0);
  });
});

describe("getPareto", () => {
  it("수동작업(제외) 건은 빼고 부동내역별로 집계·정렬한다", () => {
    const items = getPareto("2026-01", "all", 10);
    expect(items.map((i) => i.detail)).toEqual(["설비고장", "형명교체", "설비점검", "격리판교체"]);
    expect(items[0].minutes).toBe(2020);
    expect(items.find((i) => i.detail === "수동적재")).toBeUndefined();
    expect(items.at(-1)!.cumulativeRatio).toBeCloseTo(1, 6);
  });
});
