import { sqliteTable, integer, text, real, index } from "drizzle-orm/sqlite-core";

// 업로드 1건 = SMES 원본 2종(작업공수관리일자·부동공수 상세) 세트 1회 처리
export const uploads = sqliteTable("uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  summaryFile: text("summary_file").notNull(),
  detailFile: text("detail_file").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  status: text("status", { enum: ["processing", "done", "error"] }).notNull(),
  errorMessage: text("error_message"),
});

// 라인 × 일자 단위 가동율 (scripts/export_data.py의 output/agm_line_day.csv 를 그대로 적재)
export const lineDay = sqliteTable(
  "line_day",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    line: text("line").notNull(), // 'AGM조립1라인' ~ 'AGM조립4라인'
    date: text("date").notNull(), // ISO date (yyyy-mm-dd)
    productionLoss: real("production_loss").notNull(), // 생산부동
    equipmentLoss: real("equipment_loss").notNull(), // 설비부동
    materialLoss: real("material_loss").notNull(), // 자재부동
    managementLoss: real("management_loss").notNull(), // 관리부동
    lineImbalanceLoss: real("line_imbalance_loss").notNull(), // 라인언밸런스
    materialChangeLoss: real("material_change_loss").notNull(), // 부자재교체
    sixLossTotal: real("six_loss_total").notNull(),
    planMinutes: real("plan_minutes").notNull(),
    operatingMinutes: real("operating_minutes").notNull(),
    operatingRate: real("operating_rate").notNull(),
    warning: text("warning"), // analysis.line_day()의 '확인' 컬럼 ("부동>계획 확인" 등). 없으면 null (PRD FR-5)
  },
  (t) => [
    index("line_day_line_date_idx").on(t.line, t.date),
    index("line_day_date_idx").on(t.date),
  ],
);

// 부동 1건 = 1행 (라인 배분 후, output/agm_allocation.csv 를 그대로 적재) — 히트맵 드릴다운·파레토용
export const allocation = sqliteTable(
  "allocation",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    line: text("line").notNull(),
    lossCategory: text("loss_category").notNull(), // 부동유형 (표시명)
    lossDetail: text("loss_detail").notNull(), // 부동내역
    detailText: text("detail_text").notNull(), // 세부내역 원문
    allocationRatio: real("allocation_ratio").notNull(), // 배분율 (1.0 또는 0.25)
    minutesAllocated: real("minutes_allocated").notNull(),
    isManualExcluded: integer("is_manual_excluded", { mode: "boolean" }).notNull(),
  },
  (t) => [
    index("allocation_date_line_idx").on(t.date, t.line),
    index("allocation_loss_detail_idx").on(t.lossDetail),
  ],
);
