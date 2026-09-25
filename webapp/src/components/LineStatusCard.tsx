import { Gauge } from "./Gauge";
import { Sparkline } from "./Sparkline";
import { TopLossBars } from "./TopLossBars";
import { rateStatus } from "@/lib/status";
import type { LineMonthStat } from "@/lib/queries";

export interface LineStatusCardProps {
  stat: LineMonthStat;
  target: number;
}

export function LineStatusCard({ stat, target }: LineStatusCardProps) {
  const status = rateStatus(stat.rate, target);

  return (
    <div className="flex-1 min-w-[280px] rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-h3">AGM 조립 {stat.line.replace("AGM조립", "")}</span>
        <span
          className="text-caption rounded-full px-3 py-1 font-semibold"
          style={{ color: status.color, backgroundColor: `${status.color}22` }}
        >
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Gauge rate={stat.rate} target={target} color={status.color} />
        <div className="text-body-sm flex flex-col gap-1 text-text-secondary">
          <div>
            월 부동 <b className="text-text-primary">{stat.sixLossTotal.toLocaleString()}분</b>
          </div>
          <div>
            월 가동 <b className="text-text-primary">{stat.operatingMinutes.toLocaleString()}분</b>
          </div>
          {stat.lastDate && (
            <div>
              {stat.lastDate.slice(5).replace("-", "/")}{" "}
              <b className="text-text-primary">{(stat.lastRate * 100).toFixed(1)}%</b>
            </div>
          )}
        </div>
      </div>

      <div className="text-caption mt-2 mb-1 text-text-secondary">
        일자별 가동율 (점선 = 목표 {(target * 100).toFixed(0)}%)
      </div>
      <Sparkline dailyRates={stat.dailyRates} target={target} />

      <div className="text-caption mt-3 mb-1 text-text-secondary">부동 TOP 3</div>
      <TopLossBars items={stat.topLosses} />
    </div>
  );
}
