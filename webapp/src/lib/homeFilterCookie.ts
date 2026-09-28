// ①현황판의 일별/기간별/월별 선택을 다른 페이지로 이동했다가 돌아와도 유지하기 위한 쿠키.
// db를 import하지 않는 순수 파일이라 클라이언트 컴포넌트(HomeFilterPersist)에서도 바로 쓴다
// (lib/lossCategories.ts와 같은 이유 — queries.ts를 클라이언트에서 import하면 안 됨).
export const HOME_FILTER_COOKIE = "home_filter";

export interface HomeFilterCookieValue {
  mode?: string;
  period?: string;
  from?: string;
  to?: string;
  target?: string;
}

export function encodeHomeFilterCookie(value: HomeFilterCookieValue): string {
  return encodeURIComponent(JSON.stringify(value));
}

export function decodeHomeFilterCookie(raw: string | undefined): HomeFilterCookieValue {
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return {};
  }
}
