"""전체 실행: 원본 → 분석 데이터 → 엑셀 보고서 → 대시보드 예시 HTML.
VS Code에서 이 파일을 열고 F5(또는 ▶ 실행)를 누르면 됩니다."""
import subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
steps = [
    "scripts/export_data.py",
    "scripts/excel/build_base.py",
    "scripts/excel/build_summary.py",
    "scripts/excel/build_agm_lines.py",
    "scripts/dashboard/gen_mockups.py",
]
for s in steps:
    print(f"\n▶ {s}")
    subprocess.run([sys.executable, str(ROOT / s)], check=True, cwd=ROOT)
print("\n완료 — output 폴더를 확인하세요. (PNG 캡처: python scripts/dashboard/screenshot.py / PPT: node scripts/verify_ppt/build.js)")
