"use client";

import { useState, useTransition } from "react";
import { deleteUploadAction, recomputeUploadAction, resetAllAction } from "@/app/settings/actions";

export interface AdminUploadRow {
  id: number;
  year: number;
  month: number;
  uploadedAt: string;
  status: string;
  errorMessage: string | null;
  summaryFile: string;
  detailFile: string;
}

const STATUS_LABEL: Record<string, string> = {
  processing: "처리 중",
  done: "완료",
  error: "오류",
};

export function AdminPanel({
  uploads,
  onLock,
}: {
  uploads: AdminUploadRow[];
  onLock: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | "reset" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function runDelete(row: AdminUploadRow) {
    const monthKey = `${row.year}-${String(row.month).padStart(2, "0")}`;
    if (!confirm(`${monthKey} 업로드를 삭제할까요?\n해당 기간의 line_day/allocation 데이터가 모두 지워집니다.`)) {
      return;
    }
    setBusyId(row.id);
    startTransition(async () => {
      const result = await deleteUploadAction(row.id);
      setMessage({ ok: result.ok, text: result.message });
      setBusyId(null);
    });
  }

  function runRecompute(row: AdminUploadRow) {
    const monthKey = `${row.year}-${String(row.month).padStart(2, "0")}`;
    if (
      !confirm(
        `${monthKey}을(를) 원본 파일(${row.summaryFile.split(/[\\/]/).pop()} 등)로 다시 계산해서 덮어쓸까요?`,
      )
    ) {
      return;
    }
    setBusyId(row.id);
    startTransition(async () => {
      const result = await recomputeUploadAction(row.id);
      setMessage({ ok: result.ok, text: result.message });
      setBusyId(null);
    });
  }

  function runReset() {
    if (!confirm("정말로 전체 데이터를 초기화할까요? uploads/line_day/allocation이 전부 삭제됩니다.")) return;
    if (!confirm("마지막 확인입니다 — 되돌릴 수 없습니다. 계속할까요?")) return;
    setBusyId("reset");
    startTransition(async () => {
      const result = await resetAllAction();
      setMessage({ ok: result.ok, text: result.message });
      setBusyId(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-lg border border-danger bg-bg-surface p-4">
        <div>
          <div className="text-h3 text-danger">관리자 모드</div>
          <p className="text-body-sm text-text-secondary">
            여기 있는 작업들은 데이터를 되돌릴 수 없게 지웁니다. 실행 전 DB 백업을 먼저 받아두는 걸 권장합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onLock}
          className="text-button rounded-md border border-border px-4 py-2 text-text-primary hover:bg-bg-base"
        >
          관리자 모드 잠그기
        </button>
      </div>

      {message && (
        <p className={"text-body-sm " + (message.ok ? "" : "text-danger")} style={message.ok ? { color: "var(--color-success)" } : undefined}>
          {message.ok ? "✓ " : "✗ "}
          {message.text}
        </p>
      )}

      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <div className="text-h3 mb-2">DB 백업</div>
        <a
          href="/api/admin/backup"
          className="text-button inline-block rounded-md bg-accent-primary px-4 py-2 text-white"
        >
          백업 파일 다운로드 (.sqlite)
        </a>
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <div className="text-h3 mb-2">업로드 이력 관리</div>
        {uploads.length === 0 ? (
          <p className="text-body-sm text-text-secondary">업로드 이력이 없습니다.</p>
        ) : (
          <table className="text-body-sm w-full border-collapse">
            <thead>
              <tr className="text-caption text-left text-text-secondary">
                <th className="pb-1 pr-3">연월</th>
                <th className="pb-1 pr-3">업로드 시각</th>
                <th className="pb-1 pr-3">상태</th>
                <th className="pb-1 pr-3">원본 파일</th>
                <th className="pb-1">작업</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((u) => {
                const rowBusy = pending && busyId === u.id;
                return (
                  <tr key={u.id} className="border-t border-border align-top">
                    <td className="py-1 pr-3">
                      {u.year}-{String(u.month).padStart(2, "0")}
                    </td>
                    <td className="py-1 pr-3 text-text-secondary">{u.uploadedAt.slice(0, 19).replace("T", " ")}</td>
                    <td className="py-1 pr-3">{STATUS_LABEL[u.status] ?? u.status}</td>
                    <td className="py-1 pr-3 text-text-secondary">
                      {u.summaryFile.split(/[\\/]/).pop()}
                      <br />
                      {u.detailFile.split(/[\\/]/).pop()}
                    </td>
                    <td className="py-1">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() => runRecompute(u)}
                          className="text-button rounded-md border border-border px-2 py-1 text-text-primary hover:bg-bg-base disabled:opacity-50"
                        >
                          재계산
                        </button>
                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() => runDelete(u)}
                          className="text-button rounded-md bg-danger px-2 py-1 text-white disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg border border-danger bg-bg-surface p-4">
        <div className="text-h3 mb-2 text-danger">전체 초기화</div>
        <p className="text-body-sm mb-3 text-text-secondary">
          uploads·line_day·allocation 테이블을 전부 비웁니다. data/raw의 원본 파일은 지우지 않습니다.
        </p>
        <button
          type="button"
          disabled={pending && busyId === "reset"}
          onClick={runReset}
          className="text-button rounded-md bg-danger px-4 py-2 text-white disabled:opacity-50"
        >
          전체 데이터 초기화
        </button>
      </div>
    </div>
  );
}
