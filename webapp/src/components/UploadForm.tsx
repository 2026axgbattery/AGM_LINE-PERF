"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { uploadAction, type UploadState } from "@/app/upload/actions";

const initialState: UploadState = { status: "idle" };

function SubmitButton({ confirm }: { confirm: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="confirm"
      value={confirm ? "1" : "0"}
      disabled={pending}
      className={
        "text-button rounded-md px-4 py-2 text-white disabled:opacity-50 " +
        (confirm ? "bg-danger" : "bg-accent-primary")
      }
    >
      {pending ? "처리 중..." : confirm ? "확인하고 덮어쓰기" : "업로드"}
    </button>
  );
}

export function UploadForm() {
  const [state, formAction] = useActionState(uploadAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-border bg-bg-surface p-6">
      <label className="flex flex-col gap-1">
        <span className="text-body-sm text-text-secondary">작업공수관리일자 (.xls)</span>
        <input type="file" name="summary" accept=".xls,.xlsx" required className="text-body-sm" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-body-sm text-text-secondary">부동공수 상세 (.xls)</span>
        <input type="file" name="detail" accept=".xls,.xlsx" required className="text-body-sm" />
      </label>

      <SubmitButton confirm={state.status === "needs-confirm"} />

      {state.status === "needs-confirm" && (
        <p className="text-body-sm text-danger">
          {state.message} 같은 파일을 다시 선택한 뒤 위 버튼을 눌러 덮어쓸지 확인하세요.
        </p>
      )}
      {state.status === "error" && <p className="text-body-sm text-danger">✗ {state.message}</p>}
      {state.status === "done" && (
        <p className="text-body-sm" style={{ color: "var(--color-success)" }}>
          ✓ {state.year}년 {state.month}월 처리 완료 — line_day {state.summary?.lineDayRows}행, allocation{" "}
          {state.summary?.allocationRows}행
          {state.summary && state.summary.warnings > 0 && ` (검증 경고 ${state.summary.warnings}건)`}
        </p>
      )}
    </form>
  );
}
