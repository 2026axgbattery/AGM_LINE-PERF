// config.SIX_LOSSES와 이름·순서를 맞춘 6대부동 표시 라벨.
// DB(better-sqlite3)를 건드리지 않는 순수 상수라 클라이언트 컴포넌트에서도 바로 import한다
// (queries.ts는 db를 import하므로 클라이언트 컴포넌트가 그걸 import하면 번들에 better-sqlite3가
// 딸려 들어가 "Can't resolve 'fs'" 에러가 난다 — 실제로 한 번 겪은 문제).
export const LOSS_LABELS = [
  { key: "productionLoss", label: "생산부동" },
  { key: "equipmentLoss", label: "설비부동" },
  { key: "materialLoss", label: "자재부동" },
  { key: "managementLoss", label: "관리부동" },
  { key: "lineImbalanceLoss", label: "라인언밸런스" },
  { key: "materialChangeLoss", label: "부자재교체" },
] as const;

// 부동유형별 고정 색상 — 라벨 기준이라 정렬 순서(가장 큰 순)가 바뀌어도 같은 유형은 항상 같은
// 색이다. LossCompositionBar(계획가동시간 구성)·WaterfallChart(6대부동 누적)가 같이 써서 같은
// 화면 안에서 색이 서로 어긋나지 않게 한다.
export const LOSS_CATEGORY_COLOR: Record<string, string> = {
  생산부동: "#2a78d6",
  설비부동: "#eb6834",
  자재부동: "#1baf7a",
  관리부동: "#eda100",
  라인언밸런스: "#e87ba4",
  부자재교체: "#008300",
};
