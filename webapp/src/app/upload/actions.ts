"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { RAW_DIR } from "@/lib/paths";
import { getAvailableMonths } from "@/lib/queries";
import { processUpload } from "@/lib/uploadPipeline";
import { detectMonthFromSummary, validateDetailFile, validateSummaryFile } from "@/lib/validateUpload";

export interface UploadState {
  status: "idle" | "error" | "needs-confirm" | "done";
  message?: string;
  year?: number;
  month?: number;
  summary?: { lineDayRows: number; allocationRows: number; warnings: number };
}

export async function uploadAction(_prevState: UploadState, formData: FormData): Promise<UploadState> {
  const summary = formData.get("summary");
  const detail = formData.get("detail");
  const confirmed = formData.get("confirm") === "1";

  if (!(summary instanceof File) || !(detail instanceof File) || summary.size === 0 || detail.size === 0) {
    return { status: "error", message: "작업공수관리일자·부동공수 상세 파일을 모두 선택하세요." };
  }

  const summaryBuf = Buffer.from(await summary.arrayBuffer());
  const detailBuf = Buffer.from(await detail.arrayBuffer());

  const summaryCheck = validateSummaryFile(summaryBuf);
  if (!summaryCheck.ok) return { status: "error", message: summaryCheck.error };
  const detailCheck = validateDetailFile(detailBuf);
  if (!detailCheck.ok) return { status: "error", message: detailCheck.error };

  const detected = detectMonthFromSummary(summaryBuf);
  if (!detected) {
    return {
      status: "error",
      message: "작업공수관리일자 파일에서 연/월을 인식하지 못했습니다 ('일자별' 컬럼 형식 확인 필요).",
    };
  }
  const { year, month } = detected;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  if (!confirmed && getAvailableMonths().includes(monthKey)) {
    return { status: "needs-confirm", year, month, message: `${monthKey} 데이터가 이미 있습니다.` };
  }

  fs.mkdirSync(RAW_DIR, { recursive: true });
  const summaryPath = path.join(RAW_DIR, `upload_${monthKey}_summary.xls`);
  const detailPath = path.join(RAW_DIR, `upload_${monthKey}_detail.xls`);
  fs.writeFileSync(summaryPath, summaryBuf);
  fs.writeFileSync(detailPath, detailBuf);

  const result = await processUpload({ year, month, summaryFile: summaryPath, detailFile: detailPath });
  if (!result.ok) {
    return { status: "error", year, month, message: result.error };
  }

  revalidatePath("/", "layout"); // 대시보드 전 화면이 새 데이터를 즉시 반영하도록
  return {
    status: "done",
    year,
    month,
    summary: {
      lineDayRows: result.ingest.lineDayRows,
      allocationRows: result.ingest.allocationRows,
      warnings: result.ingest.warnings.length,
    },
  };
}
