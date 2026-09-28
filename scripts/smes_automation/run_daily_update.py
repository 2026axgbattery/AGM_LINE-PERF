"""SMES에서 전일자 데이터를 받아 웹앱 SQLite까지 한 번에 반영하는 수동 실행용 진입점.

**자동으로 예약 실행되지 않는다** — 사용자가 필요할 때 직접 실행해야만 동작한다
(사용자 확정 사항: 스케줄러/크론으로 자동 기동하지 않음).

순서:
  1. download_detail.py   — 부동공수분석-상세 (DETAIL_FILE 역할)
  2. download_summary.py  — 작업공수관리(일자별) (SUMMARY_FILE 역할)
  3. webapp의 `npm run ingest:run` — 위 두 파일로 export_data.py 실행 + SQLite 적재
  4. webapp의 `npm run backup:db` — SQLite 스냅샷을 backups/에 저장(최근 14개만 보관, 오래된
     건 자동 삭제). 이 삭제는 백업 파일에만 적용되고, 대시보드가 보여주는 실제 데이터
     (line_day/allocation)는 관리자 모드에서 직접 지우지 않는 한 기간 제한 없이 남는다.

전제: SMES에 이미 로그인되어 있고 창이 보이는 상태(1920x1080, 최대화)여야 한다.

실행:
    python scripts/smes_automation/run_daily_update.py
"""

import datetime
import subprocess
import sys

import download_detail
import download_summary

WEBAPP_DIR = download_detail.c.PROJECT_ROOT / "webapp"


def main():
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    year, month = yesterday.year, yesterday.month

    print("=== 1/4: 부동공수분석-상세 다운로드 ===")
    detail_path = download_detail.main()

    print("=== 2/4: 작업공수관리(일자별) 다운로드 ===")
    summary_path = download_summary.main()

    print("=== 3/4: 웹앱 SQLite 적재 (npm run ingest:run) ===")
    cmd = (
        f'npm run ingest:run -- '
        f'--summary "{summary_path}" --detail "{detail_path}" '
        f'--year {year} --month {month}'
    )
    result = subprocess.run(cmd, shell=True, cwd=str(WEBAPP_DIR))
    if result.returncode != 0:
        print("✗ 웹앱 적재 실패 — 위 로그를 확인하세요.", file=sys.stderr)
        sys.exit(result.returncode)

    print("=== 4/4: DB 백업 (npm run backup:db) ===")
    backup_result = subprocess.run("npm run backup:db", shell=True, cwd=str(WEBAPP_DIR))
    if backup_result.returncode != 0:
        # 백업 실패는 이미 끝난 데이터 반영 자체를 무효로 만들지 않으니 경고만 하고 넘어간다.
        print("⚠ 백업 실패 — 데이터는 정상 반영됐지만 백업이 안 됐습니다. 확인 필요.", file=sys.stderr)

    print(f"\n✓ {yesterday.isoformat()} 데이터가 웹앱에 반영되었습니다.")


if __name__ == "__main__":
    main()
