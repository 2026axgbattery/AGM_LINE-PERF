import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { EXPORT_SCRIPT, PROJECT_ROOT, PYTHON_BIN } from "./paths";

const execFileAsync = promisify(execFile);

export type RunExportResult =
  | { ok: true; stdout: string }
  | { ok: false; stdout: string; stderr: string };

export interface RunExportOptions {
  summaryFile: string;
  detailFile: string;
  year: number;
  month: number;
}

// scripts/export_data.py를 그대로 실행한다 — 가동율 재계산 로직은 여기 없다.
// 인자를 안 주면 config.py 기본값(현재 산출 대상 월)을 그대로 쓴다(기존 CLI 사용과 동일).
// 업로드 흐름(M5)에서는 실제 저장된 원본 경로와 연/월을 넘겨 그 달을 처리한다.
export async function runExportPipeline(options?: RunExportOptions): Promise<RunExportResult> {
  const args = options
    ? [
        EXPORT_SCRIPT,
        "--summary",
        options.summaryFile,
        "--detail",
        options.detailFile,
        "--year",
        String(options.year),
        "--month",
        String(options.month),
      ]
    : [EXPORT_SCRIPT];

  try {
    const { stdout } = await execFileAsync(PYTHON_BIN, args, {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 16,
    });
    return { ok: true, stdout };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    return { ok: false, stdout: e.stdout ?? "", stderr: e.stderr ?? e.message };
  }
}
