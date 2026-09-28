"""backfill_month.py를 연속된 월 범위에 대해 반복 실행 + 웹앱 적재까지 한 번에.
한 달이 실패해도 계속 다음 달로 넘어가고, 끝나면 성공/실패 목록을 출력한다
(실패한 달만 나중에 backfill_month.py로 재시도하면 됨).

실행:
    python scripts/smes_automation/backfill_range.py 2025 2 2026 6
"""

import subprocess
import sys

import backfill_month as bm

WEBAPP_DIR = bm.c.PROJECT_ROOT / "webapp"


def month_iter(y1, m1, y2, m2):
    y, m = y1, m1
    while (y, m) <= (y2, m2):
        yield y, m
        m += 1
        if m > 12:
            m = 1
            y += 1


def ingest(year, month, summary_path, detail_path):
    cmd = (
        f'npm run ingest:run -- '
        f'--summary "{summary_path}" --detail "{detail_path}" '
        f'--year {year} --month {month}'
    )
    return subprocess.run(cmd, shell=True, cwd=str(WEBAPP_DIR))


def main():
    y1, m1, y2, m2 = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
    ok, fail = [], []

    for year, month in month_iter(y1, m1, y2, m2):
        label = f"{year:04d}-{month:02d}"
        print(f"\n=== {label} ===")
        try:
            detail_path, summary_path = bm.download_month(year, month)
        except Exception as e:
            print(f"✗ 다운로드 실패: {e}")
            fail.append(label)
            continue

        result = ingest(year, month, summary_path, detail_path)
        if result.returncode != 0:
            print(f"✗ 적재 실패: {label}")
            fail.append(label)
        else:
            ok.append(label)

    print("\n=== 요약 ===")
    print(f"성공({len(ok)}): {', '.join(ok)}")
    print(f"실패({len(fail)}): {', '.join(fail) if fail else '없음'}")


if __name__ == "__main__":
    main()
