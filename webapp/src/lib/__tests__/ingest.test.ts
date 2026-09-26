import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { allocation, lineDay } from "@/db/schema";
import { ingestFromOutput } from "../ingest";
import { OUTPUT_DIR } from "../paths";
import { ALLOCATION_CSV, LINE_DAY_CSV } from "./fixtures";

function writeFixtures() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "agm_line_day.csv"), LINE_DAY_CSV);
  fs.writeFileSync(path.join(OUTPUT_DIR, "agm_allocation.csv"), ALLOCATION_CSV);
}

beforeEach(() => {
  db.delete(lineDay).run();
  db.delete(allocation).run();
});

describe("ingestFromOutput", () => {
  it("parses BOM(utf-8-sig) CSV correctly — line 컬럼이 undefined가 되지 않는다", () => {
    writeFixtures();
    const result = ingestFromOutput();
    expect(result.lineDayRows).toBe(4);
    expect(result.allocationRows).toBe(6);

    const rows = db.select().from(lineDay).all();
    expect(rows.every((r) => typeof r.line === "string" && r.line.length > 0)).toBe(true);
  });

  it("검증 경고('부동>계획 확인')를 감지해 warning으로 노출한다 (FR-5)", () => {
    writeFixtures();
    const result = ingestFromOutput();
    expect(result.warnings).toEqual([
      { line: "AGM조립1라인", date: "2026-01-02", warning: "부동>계획 확인" },
    ]);
  });

  it("반영구분에 따라 isManualExcluded를 올바르게 구분한다", () => {
    writeFixtures();
    ingestFromOutput();
    const rows = db.select().from(allocation).all();
    const manual = rows.filter((r) => r.isManualExcluded);
    expect(manual).toHaveLength(1);
    expect(manual[0].lossDetail).toBe("수동적재");
  });

  it("재적재 시 같은 날짜의 기존 행을 지우고 다시 넣는다 (덮어쓰기, FR-3)", () => {
    writeFixtures();
    ingestFromOutput();
    ingestFromOutput(); // 같은 데이터로 두 번 실행

    const rows = db.select().from(lineDay).all();
    expect(rows).toHaveLength(4); // 중복 삽입되지 않아야 함
  });

  it("계획가동시간을 넘는 부동은 가동시간이 0으로 클리핑된다", () => {
    writeFixtures();
    ingestFromOutput();
    const row = db
      .select()
      .from(lineDay)
      .all()
      .find((r) => r.line === "AGM조립1라인" && r.date === "2026-01-02");
    expect(row?.operatingMinutes).toBe(0);
    expect(row?.operatingRate).toBe(0);
  });
});
