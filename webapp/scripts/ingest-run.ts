// SMES 자동화 다운로드 결과를 바로 적재하는 수동 트리거용 CLI.
// ingest-once.ts는 FILES에 등록된 월별 파일명만 받지만, 이건 임의의 파일 경로를
// (scripts/smes_automation/*.py가 매일 새로 받은 파일 등) 그대로 받아 처리한다.
// 사용: npm run ingest:run -- --summary <절대경로> --detail <절대경로> --year 2026 --month 9
import path from "node:path";
import { processUpload } from "../src/lib/uploadPipeline";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const summaryFile = argValue("--summary");
const detailFile = argValue("--detail");
const year = Number(argValue("--year"));
const month = Number(argValue("--month"));

if (!summaryFile || !detailFile || !year || !month) {
  console.error(
    "사용법: npm run ingest:run -- --summary <경로> --detail <경로> --year <YYYY> --month <M>",
  );
  process.exit(1);
}

async function main() {
  console.log(`▶ ${year}년 ${month}월 적재 (summary=${path.basename(summaryFile!)}, detail=${path.basename(detailFile!)})...`);
  const result = await processUpload({
    year,
    month,
    summaryFile: summaryFile!,
    detailFile: detailFile!,
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
