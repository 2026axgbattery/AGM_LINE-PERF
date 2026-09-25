export interface NavItem {
  label: string;
  href: string;
}

export interface NavGroup {
  label?: string; // 없으면 그룹 제목 없이 항목만 표시 (예: 최상단 "현황판")
  items: NavItem[];
}

// 새 화면/그룹을 추가할 땐 여기에만 추가하면 사이드바에 반영된다.
// 향후 "생산성지표", "OEE" 그룹 추가 예정(PRD 로드맵 3~4단계) — 그룹을 새로 만들어 추가하면 됨.
export const NAV: NavGroup[] = [
  { items: [{ label: "현황판", href: "/" }] },
  {
    label: "분석",
    items: [
      { label: "히트맵", href: "/heatmap" },
      { label: "로스", href: "/loss" },
      { label: "추이", href: "/trend" },
    ],
  },
  {
    label: "관리",
    items: [
      { label: "업로드", href: "/upload" },
      { label: "설정", href: "/settings" },
    ],
  },
];
