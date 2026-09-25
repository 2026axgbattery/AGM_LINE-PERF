import { GaugeCard } from "@/components/GaugeCard";

// 더미 데이터 — M3에서 SQLite(line_day) 집계로 교체한다.
const DUMMY_LINES = [
  { label: "AGM 조립 1라인", rate: 0.902 },
  { label: "AGM 조립 2라인", rate: 0.914 },
  { label: "AGM 조립 3라인", rate: 0.9 },
  { label: "AGM 조립 4라인", rate: 0.885 },
];
const TARGET = 0.9;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div>
        <h1 className="text-h1">① 현황판</h1>
        <p className="text-body text-text-secondary">
          디자인 시스템·차트 연동 확인용 예시 데이터입니다 (M3에서 실데이터로 교체 예정).
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        {DUMMY_LINES.map((line) => (
          <GaugeCard key={line.label} label={line.label} rate={line.rate} target={TARGET} />
        ))}
      </div>
    </div>
  );
}
