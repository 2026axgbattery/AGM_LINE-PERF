"use client";

// plotly.js(전체, ~5MB) 대신 plotly.js-dist-min(필요한 트레이스 다 포함, 용량만 최소화)을 쓴다.
// react-plotly.js 기본 export는 'plotly.js'를 직접 require하므로, factory로 우리가 고른 빌드를 주입한다.
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";

const Plot = createPlotlyComponent(Plotly);
export default Plot;
