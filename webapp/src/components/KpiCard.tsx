export interface KpiCardProps {
  label: string;
  value: string;
  valueColor?: string;
  hint?: string;
  hintColor?: string;
  compact?: boolean; // 라인 카드 4개를 스크롤 없이 한 줄에 보여주기 위해 공간을 덜 차지하는 축소형
}

export function KpiCard({ label, value, valueColor, hint, hintColor, compact }: KpiCardProps) {
  return (
    <div className={`flex-1 rounded-lg border border-border bg-bg-surface ${compact ? "p-2.5" : "p-4"}`}>
      <div className="text-body-sm text-text-secondary">{label}</div>
      <div className={`${compact ? "text-h3" : "text-h2"} mt-1`} style={{ color: valueColor }}>
        {value}
      </div>
      {hint && (
        <div className="text-caption mt-1" style={{ color: hintColor }}>
          {hint}
        </div>
      )}
    </div>
  );
}
