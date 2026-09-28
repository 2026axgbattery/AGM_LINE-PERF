import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db, sqlite } from "@/db";
import { allocation, lineDay, uploads } from "@/db/schema";
import { BACKUP_DIR } from "./paths";
import { processUpload, type ProcessUploadResult } from "./uploadPipeline";

// 설정 화면의 "관리자 모드"에서 쓰는 파괴적 작업들 — 화면 쪽 액션(app/settings/actions.ts)에서
// 호출한다. uploads 행은 lineDay/allocation과 FK로 연결돼 있지 않고 year/month로만 대응되므로
// (db/schema.ts 참고), 날짜는 항상 substr(date,1,7) = 'YYYY-MM' 패턴으로 지운다.
function monthKeyOf(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export interface DeleteUploadResult {
  monthKey: string;
  deletedLineDay: number;
  deletedAllocation: number;
}

export function deleteUpload(uploadId: number): DeleteUploadResult {
  const upload = db.select().from(uploads).where(sql`${uploads.id} = ${uploadId}`).get();
  if (!upload) throw new Error(`업로드 id=${uploadId}를 찾을 수 없습니다.`);

  const monthKey = monthKeyOf(upload.year, upload.month);
  const monthPattern = `${monthKey}%`;

  let deletedLineDay = 0;
  let deletedAllocation = 0;
  db.transaction((tx) => {
    deletedLineDay = tx
      .delete(lineDay)
      .where(sql`${lineDay.date} LIKE ${monthPattern}`)
      .run().changes;
    deletedAllocation = tx
      .delete(allocation)
      .where(sql`${allocation.date} LIKE ${monthPattern}`)
      .run().changes;
    tx.delete(uploads).where(sql`${uploads.id} = ${uploadId}`).run();
  });

  return { monthKey, deletedLineDay, deletedAllocation };
}

export interface ResetAllResult {
  deletedUploads: number;
  deletedLineDay: number;
  deletedAllocation: number;
}

export function resetAll(): ResetAllResult {
  let deletedUploads = 0;
  let deletedLineDay = 0;
  let deletedAllocation = 0;
  db.transaction((tx) => {
    deletedLineDay = tx.delete(lineDay).run().changes;
    deletedAllocation = tx.delete(allocation).run().changes;
    deletedUploads = tx.delete(uploads).run().changes;
  });
  return { deletedUploads, deletedLineDay, deletedAllocation };
}

// 업로드 당시 저장된 원본 경로(summaryFile/detailFile)로 파이프라인을 다시 돌린다.
// analysis.py 로직이 바뀐 뒤 과거 달을 재계산하거나, 잘못 반영된 걸 같은 원본으로
// 다시 넣고 싶을 때 쓴다. 원본 파일이 삭제된 경우 명확한 에러를 던진다.
export async function recomputeUpload(uploadId: number): Promise<ProcessUploadResult> {
  const upload = db.select().from(uploads).where(sql`${uploads.id} = ${uploadId}`).get();
  if (!upload) throw new Error(`업로드 id=${uploadId}를 찾을 수 없습니다.`);

  for (const p of [upload.summaryFile, upload.detailFile]) {
    if (!fs.existsSync(p)) {
      throw new Error(`원본 파일이 더 이상 존재하지 않습니다: ${p}`);
    }
  }

  return processUpload({
    year: upload.year,
    month: upload.month,
    summaryFile: upload.summaryFile,
    detailFile: upload.detailFile,
  });
}

export interface BackupResult {
  filename: string;
  data: Buffer;
}

// better-sqlite3의 backup()으로 WAL 체크포인트까지 반영된 일관된 스냅샷을 임시 파일로
// 떠서 읽어 돌려준다 — DB 파일을 그냥 fs.copyFile 하면 WAL 모드에서 쓰기 도중 복사되면
// 손상된 사본이 될 수 있어 피한다.
export async function createBackup(): Promise<BackupResult> {
  const tmpPath = path.join(os.tmpdir(), `agm_oee_backup_${Date.now()}.sqlite`);
  await sqlite.backup(tmpPath);
  try {
    const data = fs.readFileSync(tmpPath);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return { filename: `agm_oee_${stamp}.sqlite`, data };
  } finally {
    fs.rmSync(tmpPath, { force: true });
  }
}

export interface ScheduledBackupResult {
  path: string;
  deletedOld: string[];
}

// SMES 일일 업데이트(scripts/smes_automation/run_daily_update.py) 끝에서 호출한다 —
// 별도 스케줄러 없이 "사용자가 자동화를 직접 실행할 때만" 백업도 같이 만들어지는 방식
// (사용자 확정 사항). createBackup()과 같은 sqlite.backup()을 쓰되, HTTP 응답용 Buffer
// 대신 backups/ 폴더에 바로 파일로 쓰고 retain개를 초과하는 오래된 백업은 지운다.
// 이 파일 삭제는 대시보드가 보여주는 실제 데이터(lineDay/allocation)와 무관하다 —
// 그쪽은 관리자 모드에서 직접 지우지 않는 한 기간 제한 없이 그대로 남는다.
export async function createScheduledBackup(retain = 14): Promise<ScheduledBackupResult> {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const backupPath = path.join(BACKUP_DIR, `agm_oee_${stamp}.sqlite`);
  await sqlite.backup(backupPath);

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("agm_oee_") && f.endsWith(".sqlite"))
    .sort(); // 파일명에 타임스탬프가 있어 문자열 정렬 = 시간순 정렬

  const deletedOld: string[] = [];
  const excess = files.length - retain;
  for (let i = 0; i < excess; i++) {
    fs.rmSync(path.join(BACKUP_DIR, files[i]), { force: true });
    deletedOld.push(files[i]);
  }

  return { path: backupPath, deletedOld };
}
