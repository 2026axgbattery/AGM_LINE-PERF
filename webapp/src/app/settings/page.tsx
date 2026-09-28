import { SettingsClient } from "@/components/SettingsClient";
import { getUploadHistory } from "@/lib/queries";

// 관리자 모드 업로드 이력은 항상 최신 상태여야 한다 (upload/page.tsx와 동일한 이유).
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const uploads = getUploadHistory(50);
  return <SettingsClient uploads={uploads} />;
}
