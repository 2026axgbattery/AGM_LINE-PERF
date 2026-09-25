// 수동 1회 검증용: Python 파이프라인 실행 → CSV → SQLite 적재 (M1 DoD 확인용)
// 사용: npm run ingest:once
import { runExportPipeline } from "../src/lib/runPython";
import { ingestFromOutput } from "../src/lib/ingest";

async function main() {
  console.log("▶ Python export_data.py 실행...");
  const result = await runExportPipeline();
  if (!result.ok) {
    console.error("✗ Python 실행 실패:\n" + result.stderr);
    process.exit(1);
  }
  console.log(result.stdout);

  console.log("▶ CSV → SQLite 적재...");
  const ingested = ingestFromOutput();
  console.log(
    `✓ 적재 완료 — line_day ${ingested.lineDayRows}행, allocation ${ingested.allocationRows}행, 날짜 ${ingested.dates[0]}~${ingested.dates.at(-1)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
