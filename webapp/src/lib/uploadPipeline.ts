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
// analysis.run_all()이 summary_path/detail_path/year/month를 받게 확장되어 있어서
// (src/agm/analysis.py 참고) 실제로 이 달의 원본으로 계산하도록 넘긴다.
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

  const pythonResult = await runExportPipeline({
    summaryFile: input.summaryFile,
    detailFile: input.detailFile,
    year: input.year,
    month: input.month,
  });
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
