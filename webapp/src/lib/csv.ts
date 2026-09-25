// 아주 단순한 CSV 직렬화 (내보내기용, FR-14). 쉼표/줄바꿈/따옴표만 이스케이프한다.
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return "﻿" + lines.join("\n"); // 엑셀 호환을 위한 BOM (CLAUDE.md 코딩 규칙과 동일한 관례)
}
