export interface ExportLinksProps {
  month: string;
  line: string;
}

// FR-14 CSV 내보내기. PNG는 각 차트 툴바(카메라 아이콘, displayModeBar:true)로 이미 지원한다.
export function ExportLinks({ month, line }: ExportLinksProps) {
  const qs = `month=${encodeURIComponent(month)}&line=${encodeURIComponent(line)}`;
  return (
    <div className="text-caption flex gap-3 text-text-secondary">
      <a className="underline hover:text-text-primary" href={`/api/export/line-day?${qs}`}>
        라인×일 CSV
      </a>
      <a className="underline hover:text-text-primary" href={`/api/export/allocation?${qs}`}>
        부동 상세 CSV
      </a>
    </div>
  );
}
