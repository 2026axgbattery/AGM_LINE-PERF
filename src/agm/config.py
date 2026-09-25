"""프로젝트 공통 설정 — 경로와 산출 기준을 한 곳에서 관리합니다."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw"
OUT_DIR = ROOT / "output"

# SMES에서 내려받은 원본 파일 (월이 바뀌면 파일명만 교체)
SUMMARY_FILE = RAW_DIR / "SMES 작업공수관리(일자) _ 7월.xls"   # 작업공수관리일자
DETAIL_FILE = RAW_DIR / "SMES 부동공수 상세_ 7월.xls"       # 부동공수 상세

EXCEL_OUT = OUT_DIR / "SMES_7월_공수부동_분석.xlsx"
PPT_OUT = OUT_DIR / "AGM라인_가동율_산출방식_검증.pptx"

YEAR, MONTH = 2026, 7

# ── 산출 기준 (사용자 확정 사항) ─────────────────────────────
LINES = ["AGM조립1라인", "AGM조립2라인", "AGM조립3라인", "AGM조립4라인"]
PLAN_MIN_PER_DAY = 1320          # 3조2교대, 교대당 8h+잔업 3h = 11h × 2교대, 휴식 미차감, 주말 동일
TARGET_RATE = 0.90               # 대시보드 목표선 (예시값 — 실제 목표로 교체)

# 6대부동: SMES 대분류명 → 표시명
SIX_LOSSES = {
    "[FA1]생산부동": "생산부동",
    "[FA2]설비부동": "설비부동",
    "[FA3]자재부동": "자재부동",
    "[FA5]생산관리부동": "관리부동",
    "[FA6]라인 언발란스 부동": "라인언밸런스",
    "[FA7]부자재 교체": "부자재교체",
}
REAL_WORK_LOSS = "[FA4]실동부동"   # 분류만 하고 부동으로 보지 않음

# 제외 라인 (세부내역 앞부분)
EXCLUDE_LINE_PATTERN = r"^\s*(GC|반자동)"
# 라인 표기: "3라인=", "2,4라인=" 등
LINE_PATTERN = r"^\s*([\d,]+)라인"
# 수동작업(가동율 제외) — 생산부동·라인언밸런스 중 아래 문구가 있는 건
MANUAL_CATS = ("[FA1]생산부동", "[FA6]라인 언발란스 부동")
MANUAL_PATTERN = r"수동\s*적재|적재제품\s*투입|제품\s*투입|제품\s*적재|긴급\s*출하|긴급\s*제품|주액\s*투입|샘플\s*작업|계약직"
