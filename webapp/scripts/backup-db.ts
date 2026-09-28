// SMES 일일 자동화(scripts/smes_automation/run_daily_update.py)가 웹앱 적재 뒤에
// 호출하는 백업 CLI. 사용: npm run backup:db [-- --retain 14]
import { createScheduledBackup } from "../src/lib/admin";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const retain = Number(argValue("--retain")) || 14;

async function main() {
  const result = await createScheduledBackup(retain);
  console.log(`✓ 백업 완료: ${result.path}`);
  if (result.deletedOld.length > 0) {
    console.log(`  (보관 ${retain}개 초과로 오래된 백업 ${result.deletedOld.length}개 삭제: ${result.deletedOld.join(", ")})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
