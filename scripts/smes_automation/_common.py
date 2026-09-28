"""SMES 화면 자동화 공통 유틸.

download_detail.py("부동공수분석-상세")와 download_period.py("작업공수관리(기간별)")가
공유하는 로직 — 메뉴 탐색, 날짜/공정 필드 입력, CSV 저장. 두 화면 모두 같은 폼
레이아웃(작업일자/기간, 공정, ~ 공정, Search, CSV)을 쓰기 때문에 좌표 상수도 대부분
동일하다 — 화면마다 다른 값(공정 필드 auto_id, 세번째 메뉴 위치, CSV 버튼 y좌표)만
각 스크립트에서 넘긴다.

전제: SMES에 이미 로그인되어 있고 창이 화면에 보이는 상태(1920x1080, 최대화)여야 한다.
"""

import time
from pathlib import Path

from pywinauto import Application, mouse, keyboard

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = PROJECT_ROOT / "data" / "raw"

MENU_현황분석 = (1221, 50)
MENU_공수관리 = (1260, 81)
ALL_DELETE_BUTTON = (215, 81)  # 상단 툴바 "All Delete" — 실행 시작 시 기존에 열려있던 탭을 모두 정리

작업일자_시작 = (256, 192)
작업일자_종료 = (650, 192)
공정_시작_버튼 = (1177, 192)
공정_종료_버튼 = (1571, 192)
SEARCH_BUTTON = (422, 155)

# "..." 버튼 좌표를 기준으로 한 상대 오프셋(두 화면 모두 동일하게 실측·검증됨).
PICKER_SEARCH_OFFSET = (-170, 122)  # 버튼 -> 항목선택 팝업의 검색창
PICKER_ROW_OFFSET = (-16, 64)  # 검색창 -> 필터링된 첫 결과 행


def connect(retries=5):
    """SMES 창에 UIA로 연결한다.

    직전에 Excel처럼 무거운 프로세스가 새로 뜬 직후(예: CSV 저장 후 자동으로 열리는
    Excel) 곧바로 connect()하면 UIA COM이 일시적으로 응답하지 않아 ElementNotFoundError가
    난다(run_daily_update.py에서 두 번째 다운로드로 넘어갈 때 실제로 겪음) — 재시도로 흡수한다.
    """
    last_err = None
    for attempt in range(retries):
        try:
            app = Application(backend="uia").connect(title_re=".*세방전지 SMES.*")
            w = app.top_window()
            w.set_focus()
            time.sleep(0.3)
            return w
        except Exception as e:
            last_err = e
            time.sleep(1.0)
    raise RuntimeError(f"SMES 창에 연결하지 못했습니다({retries}회 재시도): {last_err}")


def get_field_value(w, pane_auto_id: str) -> str:
    """SBlov_* 컨테이너 안의 Edit 컨트롤 값을 UIA ValuePattern으로 읽는다.

    이 커스텀 필드는 window_text()가 항상 빈 문자열을 반환해서(Name 속성 미사용),
    get_value()(레거시 Value 속성)로 읽어야 실제 표시 텍스트를 얻을 수 있다.
    같은 `w`(top_window) 참조를 재사용해야 한다 — 매번 새로 connect()하면 UIA COM
    호출이 몰려서 간헐적으로 COMError가 난다(실제로 겪음).
    """
    pane = w.child_window(auto_id=pane_auto_id, control_type="Pane")
    edit = pane.descendants(control_type="Edit")[0]
    return edit.get_value().strip()


def close_all_tabs():
    """실행 시작 시 이전에 열려 있던 탭을 전부 닫아, 매번 동일한 초기 상태에서 시작한다."""
    mouse.click(button="left", coords=ALL_DELETE_BUTTON)
    time.sleep(0.5)


def open_screen(third_level_coords, wait=3.0):
    """현황분석 > 공수관리 > <third_level_coords> 순으로 마우스를 누른 채 이동해 화면을 연다."""
    mouse.move(coords=MENU_현황분석)
    mouse.press(button="left", coords=MENU_현황분석)
    time.sleep(0.3)
    mouse.move(coords=MENU_공수관리)
    time.sleep(0.4)
    mouse.move(coords=third_level_coords)
    time.sleep(0.3)
    mouse.release(button="left", coords=third_level_coords)
    time.sleep(wait)  # 새 탭이 완전히 로드될 때까지 대기 (짧으면 이후 입력이 씹힘)


def set_date_field(w, coords, pane_auto_id, date_str, retries=4):
    actual = "<시도 안 함>"
    for attempt in range(retries):
        mouse.click(button="left", coords=coords)
        time.sleep(0.25)
        keyboard.send_keys("^a")
        time.sleep(0.1)
        keyboard.send_keys(date_str, with_spaces=True)
        time.sleep(0.1)
        keyboard.send_keys("{TAB}")
        time.sleep(0.4)

        try:
            actual = get_field_value(w, pane_auto_id)
        except Exception as e:
            actual = f"<읽기 실패: {e}>"
        if actual.startswith(date_str):
            return
        time.sleep(0.6)
    raise RuntimeError(f"날짜 입력 실패: 기대값={date_str!r}, 실제값={actual!r}")


def pick_process(w, button_coords, pane_auto_id, retries=4):
    """"..." 버튼을 눌러 항목 선택 팝업을 열고 'P51'로 필터링 후 첫 행을 더블클릭한다."""
    actual = "<시도 안 함>"
    for attempt in range(retries):
        mouse.click(button="left", coords=button_coords)
        time.sleep(0.8)

        search_box = (
            button_coords[0] + PICKER_SEARCH_OFFSET[0],
            button_coords[1] + PICKER_SEARCH_OFFSET[1],
        )
        mouse.click(button="left", coords=search_box)
        time.sleep(0.3)
        keyboard.send_keys("P51{ENTER}")
        time.sleep(0.7)

        row = (
            search_box[0] + PICKER_ROW_OFFSET[0],
            search_box[1] + PICKER_ROW_OFFSET[1],
        )
        mouse.double_click(button="left", coords=row)
        time.sleep(0.6)

        try:
            actual = get_field_value(w, pane_auto_id)
        except Exception as e:
            actual = f"<읽기 실패: {e}>"
        if "EBGC" in actual:
            return
        time.sleep(0.6)
    raise RuntimeError(f"공정 선택 실패: 실제값={actual!r}")


def save_via_csv(csv_button_coords, save_path: Path):
    """그리드 툴바의 CSV 버튼을 눌러 '다른 이름으로 저장' 팝업에 경로를 입력하고 저장한다."""
    mouse.click(button="left", coords=csv_button_coords)
    time.sleep(1.5)

    save_path.parent.mkdir(parents=True, exist_ok=True)
    keyboard.send_keys("^a")
    keyboard.send_keys(str(save_path), with_spaces=True, pause=0.02)
    time.sleep(0.3)
    keyboard.send_keys("{ENTER}")
    time.sleep(1.5)
