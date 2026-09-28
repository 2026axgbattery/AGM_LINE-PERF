"""임의의 연/월 하나를 통째로(1일~말일) 다운로드하는 유틸리티 — 과거 데이터를 소급해서
채울 때 쓴다(예: 2025년 1월치 전체). download_detail.py/download_summary.py는 항상
"전일"만 받도록 고정돼 있어서(사용자 확정 사항), 임의 기간이 필요한 이 작업은 별도
스크립트로 뺐다. 로직 자체(메뉴 탐색, 필드 입력, CSV 저장)는 두 스크립트와 동일하게
_common.py를 그대로 재사용한다.

전제: SMES에 이미 로그인되어 있고 창이 화면에 보이는 상태(1920x1080, 최대화)여야 한다.

실행:
    python scripts/smes_automation/backfill_month.py 2025 1
"""

import calendar
import sys
import time

import _common as c
import download_detail
import download_summary
from pywinauto import mouse


def month_range(year: int, month: int) -> tuple[str, str]:
    last_day = calendar.monthrange(year, month)[1]
    return f"{year:04d}-{month:02d}-01", f"{year:04d}-{month:02d}-{last_day:02d}"


def download_detail_for_month(year: int, month: int):
    start, end = month_range(year, month)
    w = c.connect()
    c.close_all_tabs()
    c.open_screen(download_detail.MENU_부동공수분석_상세)
    c.set_date_field(w, c.작업일자_시작, "SBlov_1", start)
    c.set_date_field(w, c.작업일자_종료, "SBlov_2", end)
    c.pick_process(w, c.공정_시작_버튼, "SBlov_3")
    c.pick_process(w, c.공정_종료_버튼, "SBlov_4")
    mouse.click(button="left", coords=c.SEARCH_BUTTON)
    time.sleep(2)
    path = c.RAW_DIR / f"부동공수분석-상세_{year:04d}-{month:02d}.xls"
    c.save_via_csv(download_detail.CSV_BUTTON, path)
    return path


def download_summary_for_month(year: int, month: int):
    start, end = month_range(year, month)
    w = c.connect()
    c.close_all_tabs()
    c.open_screen(download_summary.MENU_작업공수관리_일자별)
    c.set_date_field(w, c.작업일자_시작, "SBlov_1", start)
    c.set_date_field(w, c.작업일자_종료, "SBlov_2", end)
    c.pick_process(w, c.공정_시작_버튼, "SBlov_4")
    c.pick_process(w, c.공정_종료_버튼, "SBlov_5")
    mouse.click(button="left", coords=c.SEARCH_BUTTON)
    time.sleep(2)
    path = c.RAW_DIR / f"작업공수관리-일자별_{year:04d}-{month:02d}.xls"
    c.save_via_csv(download_summary.CSV_BUTTON, path)
    return path


def download_month(year: int, month: int):
    detail_path = download_detail_for_month(year, month)
    summary_path = download_summary_for_month(year, month)
    return detail_path, summary_path


if __name__ == "__main__":
    y, m = int(sys.argv[1]), int(sys.argv[2])
    d, s = download_month(y, m)
    print(f"DETAIL={d}")
    print(f"SUMMARY={s}")
