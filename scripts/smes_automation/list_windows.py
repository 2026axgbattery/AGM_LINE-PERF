"""SMES 자동화 1단계: 현재 열려 있는 최상위 창 목록을 출력한다.

SMES 프로그램을 실행해서 원하는 화면(예: 작업공수관리일자 조회 화면)까지
띄워둔 상태에서 이 스크립트를 실행한다. 출력된 목록에서 SMES 창의
정확한 제목(title)과 프로세스 이름(process)을 확인해 다음 단계
(dump_controls.py)에 넘길 값으로 사용한다.

실행:
    python scripts/smes_automation/list_windows.py
"""

from pywinauto import Desktop


def main() -> None:
    windows = Desktop(backend="uia").windows()
    print(f"열려 있는 최상위 창 {len(windows)}개:\n")
    for w in windows:
        try:
            title = w.window_text()
            proc = w.process_id()
            class_name = w.friendly_class_name()
        except Exception as e:  # 일부 창은 접근 중 사라지거나 예외 발생 가능
            print(f"  (조회 실패: {e})")
            continue
        if not title:
            continue
        print(f"  title={title!r}  class={class_name!r}  pid={proc}")


if __name__ == "__main__":
    main()
