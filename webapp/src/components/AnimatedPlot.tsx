"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type CSSProperties } from "react";
import type * as Plotly from "plotly.js";

const Plot = dynamic(() => import("./Plot"), { ssr: false });

const ENTER_MS = 700;

// 진입 애니메이션용 — 막대/선 계열 트레이스는 값(세로형이면 y, LossCompositionBar처럼
// orientation:"h"인 가로형이면 x)을 전부 0으로 깔아둔 버전을 만든다. indicator(Gauge)는
// value를 0으로. 그 외(테두리 등 우리가 못 알아보는 트레이스)는 그대로 둔다.
function zeroed(trace: Plotly.Data): Plotly.Data {
  const t = trace as Record<string, unknown>;
  if (t.type === "indicator") {
    return { ...t, value: 0 } as Plotly.Data;
  }
  if (t.orientation === "h" && Array.isArray(t.x)) {
    return { ...t, x: (t.x as unknown[]).map(() => 0) } as Plotly.Data;
  }
  if (Array.isArray(t.y)) {
    return { ...t, y: (t.y as unknown[]).map(() => 0) } as Plotly.Data;
  }
  return trace;
}

// 막대 트레이스엔 은은한 테두리를 더해 평면 색상 위에 살짝 음영/입체감이 생기게 하고
// (marker.line이 이미 지정돼 있으면 건드리지 않는다), indicator(Gauge)엔 트레이스 자체의
// transition을 심어둔다 — indicator는 layout.transition이 아니라 이걸 봐야 값이 부드럽게
// 스윕한다. 0→실제값, 실제값 자체 둘 다에 걸어야(entered 여부와 무관하게) 매번 애니메이션된다.
function decorate(trace: Plotly.Data): Plotly.Data {
  const t = trace as Record<string, unknown>;
  if (t.type === "indicator") {
    return { ...t, transition: { duration: ENTER_MS, easing: "cubic-in-out" } } as Plotly.Data;
  }
  if (t.type !== "bar") return trace;
  const marker = (t.marker as Record<string, unknown> | undefined) ?? {};
  if (marker.line) return trace;
  return { ...t, marker: { ...marker, line: { color: "rgba(0,0,0,0.45)", width: 2 } } } as Plotly.Data;
}

export interface AnimatedPlotProps {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  style?: CSSProperties;
  useResizeHandler?: boolean;
}

// 웹앱의 모든 Plotly 차트가 이 래퍼를 통해 그려진다(각 차트 파일은 "./Plot" 대신 이걸 dynamic
// import하기만 하면 됨). 두 가지를 공통으로 더한다:
//   1) 입체감 — 막대 테두리(음영)를 얹고, 차트 전체에 CSS drop-shadow를 깔아 평면이 아니라
//      뚜렷이 들뜬 느낌을 준다(3D 차트 요청이 아니라 순수 시각 효과, 사용자 확정 사항 — 처음
//      값을 약하게 넣었더니 티가 잘 안 난다는 피드백을 받고 더 진하게 키웠다).
//   2) 진입 애니메이션 — 처음엔 값이 0인 상태로 그렸다가 mount 직후 실제 값으로 바꿔치기한다.
//      react-plotly.js가 프롭 변경을 감지해 내부적으로 Plotly.react를 다시 호출하는데,
//      layout.transition이 있으면 그 변화를 부드럽게 보간해줘서 "0에서 자라나 완성되는"
//      효과가 난다 — 페이지 이동/필터 변경마다 컴포넌트가 새로 mount되므로 매번 재생된다.
export function AnimatedPlot({ data, layout, config, style, useResizeHandler }: AnimatedPlotProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const decorated = data.map(decorate);
  const shown = entered ? decorated : decorated.map(zeroed);

  return (
    <Plot
      data={shown}
      layout={{ ...layout, transition: { duration: ENTER_MS, easing: "cubic-in-out" } }}
      config={config}
      style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.4))", ...style }}
      useResizeHandler={useResizeHandler}
    />
  );
}
