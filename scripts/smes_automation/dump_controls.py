"""SMES 자동화 2단계: 지정한 창의 컨트롤 구조(자동화 ID 등)를 파일로 덤프한다.

list_windows.py로 확인한 SMES 창 제목의 일부(부분 문자열)를 --title로 넘기면,
그 창에 연결해 print_control_identifiers() 결과를 텍스트 파일로 저장한다.
이 결과를 보고 로그인 유지 여부, 메뉴 버튼, 조회 기간 입력란, 다운로드
버튼 등의 컨트롤 이름/자동화ID/좌표를 다음 단계 자동화 스크립트에서 쓴다.

실행 예:
    python scripts/smes_automation/dump_controls.py --title "작업공수관리"
    python scripts/smes_automation/dump_controls.py --title "작업공수관리" --backend win32

backend는 기본 uia로 시도하고, 실패하거나 컨트롤이 잘 안 잡히면(구형 Win32
프로그램에서 종종 발생) --backend win32로 다시 시도한다.
"""

import argparse
from pathlib import Path

from pywinauto import Application
from pywinauto.findwindows import ElementNotFoundError


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--title", required=True, help="창 제목에 포함된 부분 문자열")
    parser.add_argument("--backend", default="uia", choices=["uia", "win32"])
    parser.add_argument(
        "--out",
        default=None,
        help="결과 저장 경로 (기본: scripts/smes_automation/out/<title>_<backend>.txt)",
    )
    args = parser.parse_args()

    try:
        app = Application(backend=args.backend).connect(title_re=f".*{args.title}.*")
    except ElementNotFoundError:
        print(
            f"'{args.title}'가 포함된 창을 backend={args.backend}로 찾지 못했습니다. "
            "list_windows.py로 정확한 제목을 다시 확인하거나 --backend를 바꿔보세요."
        )
        return

    window = app.top_window()

    out_path = Path(args.out) if args.out else Path(__file__).parent / "out" / f"{args.title}_{args.backend}.txt"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    import io
    import contextlib

    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        window.print_control_identifiers()

    out_path.write_text(buf.getvalue(), encoding="utf-8")
    print(f"컨트롤 목록을 저장했습니다: {out_path}")
    print("이 파일 내용을 다음 단계(자동화 스크립트 작성)에 공유해 주세요.")


if __name__ == "__main__":
    main()
