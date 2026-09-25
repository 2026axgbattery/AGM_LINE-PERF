import * as XLSX from "xlsx";

export interface ValidationOk {
  ok: true;
}
export interface ValidationError {
  ok: false;
  error: string;
}

function readHeader(buf: Buffer): string[] {
  // 시트 전체를 파싱하지 않고 첫 시트의 헤더 행만 본다 (업로드 즉시 1차 형식 확인, PRD FR-1).
  const wb = XLSX.read(buf, { type: "buffer", sheetRows: 1 });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  return (rows[0] ?? []).map((c) => String(c).trim());
}

// analysis.py의 load_summary/process_kpi가 실제로 참조하는 컬럼 중 가장 특징적인 것들.
const SUMMARY_REQUIRED = ["일자별", "구분", "공정공수", "순투입공수"];
// analysis.py의 load_detail/classify/allocate가 실제로 참조하는 컬럼.
const DETAIL_REQUIRED = ["공정", "일자", "대분류명", "세부내역", "시간(분)"];

function checkColumns(header: string[], required: string[], fileLabel: string): ValidationError | null {
  const missing = required.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return {
      ok: false,
      error: `${fileLabel} 형식이 다릅니다 — 필요한 컬럼이 없습니다: ${missing.join(", ")} (파일을 잘못 선택했을 수 있습니다)`,
    };
  }
  return null;
}

export function validateSummaryFile(buf: Buffer): ValidationOk | ValidationError {
  const header = readHeader(buf);
  return checkColumns(header, SUMMARY_REQUIRED, "작업공수관리일자 파일") ?? { ok: true };
}

export function validateDetailFile(buf: Buffer): ValidationOk | ValidationError {
  const header = readHeader(buf);
  return checkColumns(header, DETAIL_REQUIRED, "부동공수 상세 파일") ?? { ok: true };
}

export interface DetectedMonth {
  year: number;
  month: number;
}

// summary 파일의 '일자별' 컬럼(예: "26/07/01")에서 연/월을 자동 인식한다 (PRD FR-2).
export function detectMonthFromSummary(buf: Buffer): DetectedMonth | null {
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

  for (const row of rows) {
    const raw = row["일자별"];
    if (typeof raw !== "string") continue;
    const m = /^(\d{2})\/(\d{2})\//.exec(raw.trim());
    if (m) {
      return { year: 2000 + Number(m[1]), month: Number(m[2]) };
    }
  }
  return null;
}
