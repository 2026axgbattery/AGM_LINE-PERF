// 수동 1회 검증용: uploads 상태 기록까지 포함한 전체 파이프라인 실행 (M1 DoD 확인용)
// 사용: npm run ingest:once [-- --year 2026 --month 8]
import { RAW_DIR } from "../src/lib/paths";
import { processUpload } from "../src/lib/uploadPipeline";
import path from "node:path";

const YEAR = Number(process.argv[process.argv.indexOf("--year") + 1]) || 2026;
const MONTH = Number(process.argv[process.argv.indexOf("--month") + 1]) || 7;

// data/raw/의 실제 SMES 파일명(공백·괄호 포함, README의 언더스코어 표기와 다름 — CLAUDE.md 참고).
const FILES: Record<number, { summary: string; detail: string }> = {
  7: { summary: "SMES 작업공수관리(일자) _ 7월.xls", detail: "SMES 부동공수 상세_ 7월.xls" },
  8: { summary: "SMES 작업공수관리(일자) _ 8월.xls", detail: "SMES 부동공수 상세_ 8월.xls" },
};

async function main() {
  const files = FILES[MONTH];
  if (!files) throw new Error(`${MONTH}월 원본 파일명이 FILES에 등록되어 있지 않습니다`);

  console.log(`▶ ${YEAR}년 ${MONTH}월 파이프라인 실행 (Python export_data.py → SQLite)...`);
  const result = await processUpload({
    year: YEAR,
    month: MONTH,
    summaryFile: path.join(RAW_DIR, files.summary),
    detailFile: path.join(RAW_DIR, files.detail),
  });

  if (!result.ok) {
    console.error(`✗ 실패 (uploads.id=${result.uploadId}):\n${result.error}`);
    process.exit(1);
  }

  const { ingest } = result;
  console.log(
    `✓ 완료 (uploads.id=${result.uploadId}) — line_day ${ingest.lineDayRows}행, allocation ${ingest.allocationRows}행, 날짜 ${ingest.dates[0]}~${ingest.dates.at(-1)}`,
  );
  if (ingest.warnings.length > 0) {
    console.warn(`⚠ 검증 경고 ${ingest.warnings.length}건:`);
    for (const w of ingest.warnings) console.warn(`  - ${w.line} ${w.date}: ${w.warning}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
