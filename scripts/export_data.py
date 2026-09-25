"""분석 엔진 결과를 CSV·JSON으로 내보냅니다 (대시보드·웹앱의 입력 데이터).

인자 없이 실행하면 config.py에 설정된 월을 그대로 처리합니다(기존과 동일).
웹앱 업로드처럼 다른 원본·다른 달을 처리해야 할 때만 --summary/--detail/--year/--month를 넘깁니다.
"""
import argparse
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from agm import analysis as A, config as C

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--summary", type=Path, default=C.SUMMARY_FILE, help="작업공수관리일자 원본 경로")
parser.add_argument("--detail", type=Path, default=C.DETAIL_FILE, help="부동공수 상세 원본 경로")
parser.add_argument("--year", type=int, default=C.YEAR)
parser.add_argument("--month", type=int, default=C.MONTH)
args = parser.parse_args()

C.OUT_DIR.mkdir(exist_ok=True)
r = A.run_all(summary_path=args.summary, detail_path=args.detail, year=args.year, month=args.month)
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
