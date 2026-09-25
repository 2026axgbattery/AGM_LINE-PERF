"""AGM 조립 1~4라인 가동율 산출 엔진.

엑셀 수식 없이 pandas만으로 같은 결과를 계산합니다.
대시보드·웹앱·자동 리포트는 이 모듈의 함수를 불러다 쓰면 됩니다.
"""
import re
import pandas as pd
from . import config as C


# ── 1. 원본 읽기 ─────────────────────────────────────────────
def load_summary(path=C.SUMMARY_FILE) -> pd.DataFrame:
    """작업공수관리일자: 일자 × 직접/간접 공수 (합계 행 제외)."""
    a = pd.read_excel(path, header=0)
    a = a[a["일자별"].notna()].copy()
    a["일자"] = pd.to_datetime("20" + a["일자별"].str.replace("/", "-"))
    return a


def load_detail(path=C.DETAIL_FILE) -> pd.DataFrame:
    """부동공수 상세: 부동 1건 = 1행 (총계 행 제외)."""
    d = pd.read_excel(path, header=0)
    d = d[d["공정"] != "총계"].copy()
    d.columns = [c.replace(" ", "") for c in d.columns]   # '인   원' → '인원'
    d["일자"] = pd.to_datetime(d["일자"])
    d["세부내역"] = d["세부내역"].astype(str)
    return d


# ── 2. 분류 ─────────────────────────────────────────────────
def classify(d: pd.DataFrame) -> pd.DataFrame:
    """각 부동 건에 대상라인·관리구분을 붙입니다."""
    d = d.copy()

    def lines_of(text):
        m = re.match(C.LINE_PATTERN, text)
        return [f"AGM조립{x}라인" for x in m.group(1).split(",") if x] if m else []

    def kind(r):
        if r["대분류명"] == C.REAL_WORK_LOSS:
            return "실동부동(분류만)"
        if re.match(C.EXCLUDE_LINE_PATTERN, r["세부내역"]):
            return "제외(GC·반자동)"
        if r["대분류명"] in C.MANUAL_CATS and re.search(C.MANUAL_PATTERN, r["세부내역"]):
            return "수동작업(제외)"
        return "6대부동-AGM라인" if lines_of(r["세부내역"]) else "6대부동-AGM공통(균등배분)"

    d["대상라인"] = d["세부내역"].apply(lines_of)
    d["관리구분"] = d.apply(kind, axis=1)
    return d


def allocate(d: pd.DataFrame) -> pd.DataFrame:
    """라인별 배분 테이블. 단일/복수 라인 = 각 100%, 미표기 AGM 공통 = 4개 라인 25%."""
    rows = []
    targets = d[d["관리구분"].isin(["6대부동-AGM라인", "6대부동-AGM공통(균등배분)", "수동작업(제외)"])]
    for idx, r in targets.iterrows():
        tg = [(l, 1.0) for l in r["대상라인"]] or [(l, 0.25) for l in C.LINES]
        for line, f in tg:
            rows.append({
                "원본idx": idx, "일자": r["일자"], "라인": line, "대분류명": r["대분류명"],
                "부동유형": C.SIX_LOSSES.get(r["대분류명"], r["대분류명"]),
                "부동내역": r["부동내역"], "세부내역": r["세부내역"],
                "원본시간분": r["시간(분)"], "배분율": f, "배분시간분": r["시간(분)"] * f,
                "반영구분": "수동작업(제외)" if r["관리구분"] == "수동작업(제외)" else "가동율반영",
            })
    return pd.DataFrame(rows)


# ── 3. 가동율 ───────────────────────────────────────────────
def line_day(alloc: pd.DataFrame, plan=C.PLAN_MIN_PER_DAY, year=C.YEAR, month=C.MONTH) -> pd.DataFrame:
    """라인 × 일자 × 6대부동 시간(분)과 시간가동율."""
    a = alloc[alloc["반영구분"] == "가동율반영"]
    days = pd.date_range(f"{year}-{month:02d}-01", periods=pd.Period(f"{year}-{month:02d}").days_in_month)
    idx = pd.MultiIndex.from_product([C.LINES, days], names=["라인", "일자"])
    t = a.pivot_table(index=["라인", "일자"], columns="부동유형", values="배분시간분", aggfunc="sum")
    t = t.reindex(idx).reindex(columns=list(C.SIX_LOSSES.values())).fillna(0)
    t["6대부동합계"] = t.sum(axis=1)
    t["계획가동시간"] = plan
    t["가동시간"] = (t["계획가동시간"] - t["6대부동합계"]).clip(lower=0)
    t["시간가동율"] = t["가동시간"] / t["계획가동시간"]
    t["확인"] = (t["6대부동합계"] > t["계획가동시간"]).map({True: "부동>계획 확인", False: ""})
    return t.reset_index()


def monthly(ld: pd.DataFrame) -> pd.DataFrame:
    """라인별 월 합계와 월 시간가동율."""
    cols = list(C.SIX_LOSSES.values()) + ["6대부동합계", "계획가동시간", "가동시간"]
    m = ld.groupby("라인")[cols].sum()
    m.loc["4개 라인 합계"] = m.sum()
    m["월시간가동율"] = m["가동시간"] / m["계획가동시간"]
    return m


def pareto(alloc: pd.DataFrame, top=10) -> pd.DataFrame:
    a = alloc[alloc["반영구분"] == "가동율반영"]
    p = a.groupby("부동내역")["배분시간분"].sum().sort_values(ascending=False)
    out = p.to_frame("분")
    out["누적비율"] = out["분"].cumsum() / out["분"].sum()
    return out.head(top)


def process_kpi(summary: pd.DataFrame, kind="직접") -> dict:
    """공정(P51) 단위 공수 지표 — 기존 총시간생산성 엑셀과 같은 산식."""
    s = summary[summary["구분"] == kind]
    six = s[["생산부동", "설비부동", "자재부동", "라인언발라스부동", "부자재교체부동", "관리부동"]].sum().sum()
    투입 = s["순투입공수"].sum()          # 기존 파일 '투입시간'
    공정 = s["공정공수"].sum()
    return {
        "공정공수": 공정, "실동부동": s["실동부동"].sum(), "투입시간": 투입, "6대부동": six,
        "순작업공수": 투입 - six,              # 기존 파일 '순투입시간'
        "실동률": 투입 / 공정, "공수가동율": (투입 - six) / 투입, "6대부동률": six / 투입,
        "설비부동률": s["설비부동"].sum() / 투입,
    }


def run_all(summary_path=C.SUMMARY_FILE, detail_path=C.DETAIL_FILE, year=C.YEAR, month=C.MONTH):
    """원본 → 분류 → 배분 → 가동율까지 한 번에.

    인자를 안 주면 config.py 기본값(현재 산출 대상 월)과 완전히 동일하게 동작한다.
    웹앱 업로드(여러 달)처럼 다른 파일·다른 달을 넘겨야 할 때만 인자로 override한다.
    """
    summary, detail = load_summary(summary_path), classify(load_detail(detail_path))
    alloc = allocate(detail)
    ld = line_day(alloc, year=year, month=month)
    return {"summary": summary, "detail": detail, "alloc": alloc,
            "line_day": ld, "monthly": monthly(ld), "pareto": pareto(alloc), "kpi": process_kpi(summary)}
