"""SMES "부동공수분석-상세" 화면을 자동으로 열어 전일자 데이터를 엑셀로 내려받는다.

전제:
- SMES에 이미 로그인되어 있고, 창이 화면에 보이는 상태(최소화 아님)여야 한다.
  (로그인 자체는 자동화하지 않는다 — 사용자가 매일 로그인 상태를 유지)
- 창 해상도/레이아웃이 조사 당시(1920x1080, 최대화)와 같아야 한다.
  화면 배치가 바뀌면 scripts/smes_automation/_common.py의 좌표들을 다시 잡아야 한다.

동작 순서 (사용자가 지정한 절차):
  1. 상단 메뉴 "현황분석" 위에서 마우스 버튼을 누른 채 유지 → 드롭다운이 열린다.
  2. 누른 채로 "공수관리" 위로 이동 → 다음 단계 카테고리가 펼쳐진다.
  3. 누른 채로 "부동공수분석-상세" 위로 이동 후 버튼을 놓으면 화면이 열린다.
  4. 작업일자(시작/종료)를 PC 기준 전일로 입력.
  5. 공정/~ 공정 입력란에 "[P51] EBGC조립"을 각각 선택.
  6. Search 클릭 → 조회.
  7. 그리드 툴바의 CSV 버튼 클릭 → "다른 이름으로 저장" 팝업.
  8. data/raw/ 아래에 날짜가 포함된 파일명으로 저장.

실행:
    python scripts/smes_automation/download_detail.py
"""

import datetime
import time

from pywinauto import mouse

import _common as c

MENU_부동공수분석_상세 = (1543, 174)  # 현황분석>공수관리 드롭다운에서 세번째 단계 항목 위치
CSV_BUTTON = (37, 260)


def main():
    yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()

    w = c.connect()
    c.close_all_tabs()
    c.open_screen(MENU_부동공수분석_상세)

    c.set_date_field(w, c.작업일자_시작, "SBlov_1", yesterday)
    c.set_date_field(w, c.작업일자_종료, "SBlov_2", yesterday)

    c.pick_process(w, c.공정_시작_버튼, "SBlov_3")
    c.pick_process(w, c.공정_종료_버튼, "SBlov_4")

    mouse.click(button="left", coords=c.SEARCH_BUTTON)
    time.sleep(2)

    save_path = c.RAW_DIR / f"부동공수분석-상세_{yesterday}.xls"
    c.save_via_csv(CSV_BUTTON, save_path)

    print(f"저장 완료: {save_path}")
    return save_path


if __name__ == "__main__":
    main()
