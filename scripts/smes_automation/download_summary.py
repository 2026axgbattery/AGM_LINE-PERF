"""SMES "작업공수관리(일자별)" 화면을 자동으로 열어 전일자 데이터를 엑셀로 내려받는다.

`src/agm/config.py`의 `SUMMARY_FILE`이 기대하는 바로 그 컬럼 구조(일자별, 순투입공수,
실동부동, 6대부동 등)를 내려주는 화면이다 — 처음에는 "작업공수관리(기간별)"로
자동화했지만, 그 화면은 공정×구분 집계표라 컬럼이 완전히 달라서(일자별 컬럼 없음)
`load_summary()`와 맞지 않아 이 화면으로 교체했다.

전제:
- SMES에 이미 로그인되어 있고, 창이 화면에 보이는 상태(최소화 아님)여야 한다.
- 창 해상도/레이아웃이 조사 당시(1920x1080, 최대화)와 같아야 한다.

동작 순서 (download_detail.py와 동일한 패턴):
  1~3. 현황분석 > 공수관리 > 작업공수관리(일자별) 순으로 마우스를 누른 채 이동해 화면을 연다.
  4. 기간(시작/종료)을 PC 기준 전일로 입력.
  5. 공정/~ 공정 입력란에 "[P51] EBGC조립"을 각각 선택. (공수구분은 기본값 "전체" 그대로 둠)
  6. Search 클릭 → 조회.
  7. 그리드 툴바의 CSV 버튼 클릭 → "다른 이름으로 저장" 팝업.
  8. data/raw/ 아래에 날짜가 포함된 파일명으로 저장.

작업공수관리(기간별)와 폼 좌표·auto_id가 완전히 동일하다(같은 화면 템플릿을 씀) —
세번째 단계 메뉴 위치만 다르다(일자별이 기간별보다 한 칸 위에 있음).

실행:
    python scripts/smes_automation/download_summary.py
"""

import datetime
import time

from pywinauto import mouse

import _common as c

MENU_작업공수관리_일자별 = (1543, 85)  # 현황분석>공수관리 드롭다운에서 세번째 단계 항목 위치
CSV_BUTTON = (38, 298)


def main():
    yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()

    w = c.connect()
    c.close_all_tabs()
    c.open_screen(MENU_작업공수관리_일자별)

    c.set_date_field(w, c.작업일자_시작, "SBlov_1", yesterday)
    c.set_date_field(w, c.작업일자_종료, "SBlov_2", yesterday)

    c.pick_process(w, c.공정_시작_버튼, "SBlov_4")
    c.pick_process(w, c.공정_종료_버튼, "SBlov_5")

    mouse.click(button="left", coords=c.SEARCH_BUTTON)
    time.sleep(2)

    save_path = c.RAW_DIR / f"작업공수관리-일자별_{yesterday}.xls"
    c.save_via_csv(CSV_BUTTON, save_path)

    print(f"저장 완료: {save_path}")
    return save_path


if __name__ == "__main__":
    main()
