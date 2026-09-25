import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { EXPORT_SCRIPT, PROJECT_ROOT, PYTHON_BIN } from "./paths";

const execFileAsync = promisify(execFile);

export type RunExportResult =
  | { ok: true; stdout: string }
  | { ok: false; stdout: string; stderr: string };

// scripts/export_data.py를 그대로 실행한다 — 가동율 재계산 로직은 여기 없다.
// 현재는 src/agm/config.py에 고정된 연/월(YEAR, MONTH)과 원본 파일명을 기준으로 동작한다
// (여러 달을 파라미터로 넘기는 것은 M5 업로드 단계에서 config를 확장할 때 다룬다).
export async function runExportPipeline(): Promise<RunExportResult> {
  try {
    const { stdout } = await execFileAsync(PYTHON_BIN, [EXPORT_SCRIPT], {
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
