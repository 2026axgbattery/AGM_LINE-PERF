import { Gauge } from "./Gauge";
import { TopLossBars } from "./TopLossBars";
import { rateStatus } from "@/lib/status";
import type { LineMonthStat } from "@/lib/queries";

export interface LineStatusCardProps {
  stat: LineMonthStat;
  target: number;
  periodLabel?: string; // "월"(기본) 또는 "일" — ①현황판 일별/월별 토글용 (HomeFilterBar 참고)
}

export function LineStatusCard({ stat, target, periodLabel = "월" }: LineStatusCardProps) {
  const status = rateStatus(stat.rate, target);

  return (
    <div className="min-w-0 rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-h3 whitespace-nowrap">AGM 조립 {stat.line.replace("AGM조립", "")}</span>
        <span
          className="text-caption whitespace-nowrap rounded-full px-3 py-1 font-semibold"
          style={{ color: status.color, backgroundColor: `${status.color}22` }}
        >
          {status.label}
        </span>
      </div>

      <Gauge rate={stat.rate} target={target} color={status.color} isNoData={status.level === "noData"} />

      <div className="text-body-sm -mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1 text-center text-text-secondary">
        <div>
          {periodLabel} 부동 <b className="text-text-primary">{stat.sixLossTotal.toLocaleString()}분</b>
        </div>
        <div>
          {periodLabel} 가동 <b className="text-text-primary">{stat.operatingMinutes.toLocaleString()}분</b>
        </div>
        {stat.lastDate && (
          <div>
            {stat.lastDate.slice(5).replace("-", "/")}{" "}
            <b className="text-text-primary">
              {stat.lastRate === 1 ? <span style={{ color: status.color }}>비가동</span> : `${(stat.lastRate * 100).toFixed(1)}%`}
            </b>
          </div>
        )}
      </div>

      <div className="text-caption mt-3 mb-1 text-text-secondary">부동 TOP 3</div>
      <TopLossBars items={stat.topLosses} />
    </div>
  );
}
