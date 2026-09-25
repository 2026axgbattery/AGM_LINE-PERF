// n일 이동평균 (⑤추이 화면, FR-12). 앞쪽은 현재까지의 값만으로 평균낸다(mockup과 동일 방식).
export function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const from = Math.max(0, i - window + 1);
    const slice = values.slice(from, i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}
