"use server";

import { revalidatePath } from "next/cache";
import { deleteUpload, recomputeUpload, resetAll } from "@/lib/admin";

export interface AdminActionResult {
  ok: boolean;
  message: string;
}

export async function deleteUploadAction(uploadId: number): Promise<AdminActionResult> {
  try {
    const r = deleteUpload(uploadId);
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `${r.monthKey} 삭제 완료 — line_day ${r.deletedLineDay}행, allocation ${r.deletedAllocation}행 제거`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function resetAllAction(): Promise<AdminActionResult> {
  try {
    const r = resetAll();
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `전체 초기화 완료 — uploads ${r.deletedUploads}행, line_day ${r.deletedLineDay}행, allocation ${r.deletedAllocation}행 삭제`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function recomputeUploadAction(uploadId: number): Promise<AdminActionResult> {
  try {
    const result = await recomputeUpload(uploadId);
    if (!result.ok) return { ok: false, message: result.error };
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `재계산 완료 — line_day ${result.ingest.lineDayRows}행, allocation ${result.ingest.allocationRows}행`,
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}
