import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { ingestFromOutput, type IngestResult } from "./ingest";
import { runExportPipeline } from "./runPython";

export interface ProcessUploadInput {
  year: number;
  month: number;
  summaryFile: string; // 저장된 원본 파일 경로 (표시·기록용)
  detailFile: string;
}

export type ProcessUploadResult =
  | { ok: true; uploadId: number; ingest: IngestResult }
  | { ok: false; uploadId: number; error: string };

// uploads 테이블에 상태(processing→done|error)를 기록하며 파이프라인을 실행한다 (PRD FR-1~5).
// 주의: 지금은 src/agm/config.py에 고정된 연/월(YEAR, MONTH)로 Python이 실행되므로,
// year/month/파일 경로는 현재 "기록용 메타데이터"일 뿐 실제 실행 대상을 바꾸지 않는다.
// 여러 달을 실제로 파라미터화하는 것은 M5에서 config.py 확장과 함께 처리한다.
export async function processUpload(input: ProcessUploadInput): Promise<ProcessUploadResult> {
  const [{ id: uploadId }] = db
    .insert(uploads)
    .values({
      year: input.year,
      month: input.month,
      summaryFile: input.summaryFile,
      detailFile: input.detailFile,
      uploadedAt: new Date().toISOString(),
      status: "processing",
    })
    .returning({ id: uploads.id })
    .all();

  const pythonResult = await runExportPipeline();
  if (!pythonResult.ok) {
    db.update(uploads)
      .set({ status: "error", errorMessage: pythonResult.stderr })
      .where(eq(uploads.id, uploadId))
      .run();
    return { ok: false, uploadId, error: pythonResult.stderr };
  }

  try {
    const ingestResult = ingestFromOutput();
    db.update(uploads).set({ status: "done" }).where(eq(uploads.id, uploadId)).run();
    return { ok: true, uploadId, ingest: ingestResult };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    db.update(uploads)
      .set({ status: "error", errorMessage: message })
      .where(eq(uploads.id, uploadId))
      .run();
    return { ok: false, uploadId, error: message };
  }
}
