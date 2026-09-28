// 설정 화면 "관리자 모드" 잠금해제 상태 — 로고 5연속 클릭(Sidebar.tsx)과 설정 화면
// (SettingsClient.tsx)이 이 키/이벤트로 통신한다. 인증 게이트 없음(사용자 확정 사항 —
// 사내망 배포이고 이미 SMES/사내 시스템 접근이 통제된 환경이라 별도 비밀번호 없이
// 5클릭만으로 해제되게 둔다).
export const ADMIN_UNLOCK_STORAGE_KEY = "agm_oee_admin_unlocked";
export const ADMIN_UNLOCK_EVENT = "agm-oee-admin-unlock";

export function unlockAdminMode() {
  localStorage.setItem(ADMIN_UNLOCK_STORAGE_KEY, "1");
  window.dispatchEvent(new Event(ADMIN_UNLOCK_EVENT));
}

export function isAdminUnlocked(): boolean {
  return localStorage.getItem(ADMIN_UNLOCK_STORAGE_KEY) === "1";
}

export function lockAdminMode() {
  localStorage.removeItem(ADMIN_UNLOCK_STORAGE_KEY);
  window.dispatchEvent(new Event(ADMIN_UNLOCK_EVENT));
}
