import { UploadForm } from "@/components/UploadForm";
import { getUploadHistory } from "@/lib/queries";

// 업로드 이력은 매 요청 최신 상태로 보여야 한다 — DB를 읽지만 searchParams 등 동적 신호가
// 없어 Next가 빌드 타임에 정적 스냅샷으로 굳혀버릴 수 있어 명시적으로 강제한다.
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  processing: "처리 중",
  done: "완료",
  error: "오류",
};

export default function UploadPage() {
  const history = getUploadHistory();

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-h1">SMES 원본 업로드</h1>
        <p className="text-body text-text-secondary">
          작업공수관리일자·부동공수 상세 두 파일을 올리면 연/월을 자동 인식해 처리합니다.
        </p>
      </div>

      <div className="max-w-xl">
        <UploadForm />
      </div>

      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <div className="text-h3 mb-2">최근 업로드</div>
        {history.length === 0 ? (
          <p className="text-body-sm text-text-secondary">아직 업로드 이력이 없습니다.</p>
        ) : (
          <table className="text-body-sm w-full border-collapse">
            <thead>
              <tr className="text-caption text-left text-text-secondary">
                <th className="pb-1 pr-3">연월</th>
                <th className="pb-1 pr-3">업로드 시각</th>
                <th className="pb-1 pr-3">상태</th>
                <th className="pb-1">메시지</th>
              </tr>
            </thead>
            <tbody>
              {history.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="py-1 pr-3">
                    {u.year}-{String(u.month).padStart(2, "0")}
                  </td>
                  <td className="py-1 pr-3 text-text-secondary">{u.uploadedAt.slice(0, 19).replace("T", " ")}</td>
                  <td className="py-1 pr-3">{STATUS_LABEL[u.status] ?? u.status}</td>
                  <td className="py-1 text-text-secondary">{u.errorMessage?.slice(0, 120) ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
