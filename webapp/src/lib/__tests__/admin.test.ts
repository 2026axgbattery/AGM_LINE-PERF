import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { allocation, lineDay, uploads } from "@/db/schema";
import { createScheduledBackup, deleteUpload, resetAll } from "../admin";
import { ingestFromOutput } from "../ingest";
import { BACKUP_DIR, OUTPUT_DIR } from "../paths";
import { ALLOCATION_CSV, LINE_DAY_CSV } from "./fixtures";

// fixtures.ts는 2026-01, AGM조립1/2라인 2일치 데이터 — deleteUpload가 uploads 테이블의
// year/month로만 lineDay/allocation을 찾는다는 걸(FK 없음, db/schema.ts 참고) 검증한다.
beforeEach(() => {
  db.delete(lineDay).run();
  db.delete(allocation).run();
  db.delete(uploads).run();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "agm_line_day.csv"), LINE_DAY_CSV);
  fs.writeFileSync(path.join(OUTPUT_DIR, "agm_allocation.csv"), ALLOCATION_CSV);
  ingestFromOutput();
});

function insertUpload(year: number, month: number) {
  return db
    .insert(uploads)
    .values({
      year,
      month,
      summaryFile: "dummy_summary.xls",
      detailFile: "dummy_detail.xls",
      uploadedAt: new Date().toISOString(),
      status: "done",
    })
    .returning({ id: uploads.id })
    .get().id;
}

describe("deleteUpload", () => {
  it("해당 월의 line_day/allocation을 지우고 uploads 행도 지운다", () => {
    const id = insertUpload(2026, 1);

    const result = deleteUpload(id);

    expect(result.monthKey).toBe("2026-01");
    expect(result.deletedLineDay).toBe(4); // 2라인 x 2일
    expect(result.deletedAllocation).toBe(6);
    expect(db.select().from(lineDay).all()).toHaveLength(0);
    expect(db.select().from(allocation).all()).toHaveLength(0);
    expect(db.select().from(uploads).all()).toHaveLength(0);
  });

  it("다른 달 데이터는 건드리지 않는다", () => {
    const otherId = insertUpload(2026, 1);
    // 2026-02는 실제 line_day 행이 없는 업로드 기록만 있는 상황을 흉내낸다.
    const unrelatedId = insertUpload(2026, 2);

    deleteUpload(unrelatedId);

    expect(db.select().from(lineDay).all()).toHaveLength(4); // 2026-01 데이터 그대로
    const remainingIds = db.select().from(uploads).all().map((u) => u.id);
    expect(remainingIds).toContain(otherId);
    expect(remainingIds).not.toContain(unrelatedId);
  });

  it("없는 업로드 id면 에러를 던진다", () => {
    expect(() => deleteUpload(999999)).toThrow();
  });
});

describe("resetAll", () => {
  it("세 테이블을 전부 비운다", () => {
    insertUpload(2026, 1);

    const result = resetAll();

    expect(result.deletedUploads).toBe(1);
    expect(result.deletedLineDay).toBe(4);
    expect(result.deletedAllocation).toBe(6);
    expect(db.select().from(lineDay).all()).toHaveLength(0);
    expect(db.select().from(allocation).all()).toHaveLength(0);
    expect(db.select().from(uploads).all()).toHaveLength(0);
  });
});

describe("createScheduledBackup", () => {
  beforeEach(() => {
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  });

  it("retain 개수를 넘는 오래된 백업을 지운다 (대시보드 데이터와는 무관)", async () => {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    // 기존에 이미 있던(오래된) 백업 2개를 흉내낸다 — 실제 함수 호출 없이 파일명만 직접 만들어서
    // 같은 초 안에 여러 번 호출할 때 생기는 타임스탬프 충돌을 피한다.
    fs.writeFileSync(path.join(BACKUP_DIR, "agm_oee_2020-01-01-00-00-00.sqlite"), "old1");
    fs.writeFileSync(path.join(BACKUP_DIR, "agm_oee_2020-01-02-00-00-00.sqlite"), "old2");

    const result = await createScheduledBackup(2);

    const remaining = fs.readdirSync(BACKUP_DIR).sort();
    expect(remaining).toHaveLength(2);
    expect(remaining).not.toContain("agm_oee_2020-01-01-00-00-00.sqlite"); // 가장 오래된 것부터 삭제
    expect(result.deletedOld).toEqual(["agm_oee_2020-01-01-00-00-00.sqlite"]);
    expect(fs.existsSync(result.path)).toBe(true);
  });
});
