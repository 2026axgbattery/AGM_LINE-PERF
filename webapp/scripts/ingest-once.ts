// 수동 1회 검증용: uploads 상태 기록까지 포함한 전체 파이프라인 실행 (M1 DoD 확인용)
// 사용: npm run ingest:once
import { RAW_DIR } from "../src/lib/paths";
import { processUpload } from "../src/lib/uploadPipeline";
import path from "node:path";
// config.py에 고정된 현재 대상(2026년 7월)에 맞춘 메타데이터. 실제 실행 대상은 바꾸지 않는다.
const YEAR = 2026;
const MONTH = 7;

async function main() {
  console.log(`▶ ${YEAR}년 ${MONTH}월 파이프라인 실행 (Python export_data.py → SQLite)...`);
  const result = await processUpload({
    year: YEAR,
    month: MONTH,
    summaryFile: path.join(RAW_DIR, "SMES_작업공수관리일자_7월.xls"),
    detailFile: path.join(RAW_DIR, "SMES_부동공수상세_7월.xls"),
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
