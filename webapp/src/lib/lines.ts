// src/agm/config.py의 LINES와 순서·이름을 맞춘다.
export const LINES = ["AGM조립1라인", "AGM조립2라인", "AGM조립3라인", "AGM조립4라인"] as const;

export const LINE_SHORT_LABEL: Record<string, string> = {
  AGM조립1라인: "1라인",
  AGM조립2라인: "2라인",
  AGM조립3라인: "3라인",
  AGM조립4라인: "4라인",
};

export const DEFAULT_TARGET_RATE = 0.9; // src/agm/config.py의 TARGET_RATE와 동일 (예시값)
