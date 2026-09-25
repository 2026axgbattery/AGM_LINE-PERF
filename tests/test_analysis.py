"""산출 결과가 7월 검증값과 같은지 확인하는 회귀 테스트 (pytest)."""
import sys
from pathlib import Path
import pytest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from agm import analysis as A

@pytest.fixture(scope="module")
def r():
    return A.run_all()

def test_monthly_rates(r):
    m = r["monthly"]["월시간가동율"]
    assert m["AGM조립1라인"] == pytest.approx(0.9016, abs=1e-4)
    assert m["AGM조립2라인"] == pytest.approx(0.9143, abs=1e-4)
    assert m["AGM조립3라인"] == pytest.approx(0.8999, abs=1e-4)
    assert m["AGM조립4라인"] == pytest.approx(0.8854, abs=1e-4)

def test_total_loss(r):
    assert r["monthly"].loc["4개 라인 합계", "6대부동합계"] == pytest.approx(16319.0)

def test_manual_excluded(r):
    a = r["alloc"]
    assert a.query("반영구분=='수동작업(제외)'")["배분시간분"].sum() == pytest.approx(8650.0)

def test_process_kpi_same_formula_as_legacy(r):
    k = r["kpi"]
    assert k["6대부동"] == pytest.approx(883.72)
    assert k["공수가동율"] == pytest.approx(1 - k["6대부동률"])

def test_detail_reconciles_with_summary(r):
    """부동상세 합계 = 작업공수관리 부동 컬럼 합계 (두 파일 연결 검증)."""
    s = r["summary"]; d = r["detail"]
    six_cols = ["생산부동", "설비부동", "자재부동", "라인언발라스부동", "부자재교체부동", "관리부동", "실동부동"]
    assert d["공수"].sum() == pytest.approx(s[six_cols].sum().sum(), abs=0.05)
