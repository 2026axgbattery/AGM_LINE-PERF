export interface KpiCardProps {
  label: string;
  value: string;
  valueColor?: string;
  hint?: string;
  hintColor?: string;
}

export function KpiCard({ label, value, valueColor, hint, hintColor }: KpiCardProps) {
  return (
    <div className="flex-1 rounded-lg border border-border bg-bg-surface p-4">
      <div className="text-body-sm text-text-secondary">{label}</div>
      <div className="text-h2 mt-1" style={{ color: valueColor }}>
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
