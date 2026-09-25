"""분석 엔진 결과를 CSV·JSON으로 내보냅니다 (대시보드·웹앱의 입력 데이터)."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from agm import analysis as A, config as C

C.OUT_DIR.mkdir(exist_ok=True)
r = A.run_all()
r["line_day"].to_csv(C.OUT_DIR / "agm_line_day.csv", index=False, encoding="utf-8-sig")
r["monthly"].to_csv(C.OUT_DIR / "agm_monthly.csv", encoding="utf-8-sig")
r["alloc"].to_csv(C.OUT_DIR / "agm_allocation.csv", index=False, encoding="utf-8-sig")

ld = r["line_day"]
data = {"lines": {}, "pareto": [[k, round(v, 1)] for k, v in r["pareto"]["분"].items()],
        "pareto_total": round(r["alloc"].query("반영구분=='가동율반영'")["배분시간분"].sum(), 1)}
for line, g in ld.groupby("라인"):
    g = g.sort_values("일자")
    data["lines"][line] = {"rate": g["시간가동율"].round(4).tolist(),
                           **{c: g[c].round(1).tolist() for c in C.SIX_LOSSES.values()}}
json.dump(data, open(C.OUT_DIR / "dashboard_data.json", "w", encoding="utf-8"), ensure_ascii=False)
print(r["monthly"][["6대부동합계", "월시간가동율"]].round(4))
print("saved:", C.OUT_DIR)
