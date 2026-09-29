# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 목적
세방전지 창원공장 EBGC조립(P51) 중 **AGM 조립 1~4라인**의 가동율을 SMES 원본으로 산출하고, 최종적으로 직관적인 가동율 대시보드를 만든다.

## 명령어

```powershell
# 최초 1회 설정
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 전체 파이프라인 실행 (원본 → 분석 CSV/JSON → 엑셀 3종 → 대시보드 목업 5종)
python run_pipeline.py

# 분석 데이터만 (CSV·JSON, output/ 폴더)
python scripts/export_data.py

# 산출 로직 회귀 테스트 (7월 검증값과 비교) — 로직을 바꾸면 반드시 실행
pytest
pytest tests/test_analysis.py::test_monthly_rates   # 단일 테스트만

# 대시보드 목업 PNG 캡처 (playwright 필요)
python scripts/dashboard/screenshot.py

# 검증용 PPT 생성 (Node.js 필요, 최초 1회 npm install)
npm run ppt
```

새 달 데이터를 CLI로 돌릴 때는 `data/raw/`에 SMES 원본 2종을 넣고 `src/agm/config.py`의 `SUMMARY_FILE`, `DETAIL_FILE`, `EXCEL_OUT`, `MONTH`를 수정한 뒤 `python run_pipeline.py`를 실행한다(엑셀 3종·목업까지 전부 만들 때). 웹앱만 갱신하면 되면 `python scripts/export_data.py --summary <경로> --detail <경로> --year <YYYY> --month <M>`처럼 인자로 넘길 수 있다(인자를 안 주면 config.py 기본값 그대로, 웹앱의 `/upload` 업로드도 내부적으로 이 인자들을 씀 — `src/agm/analysis.py`의 `run_all()`이 받는다). **SMES가 실제로 내려주는 파일명은 고정된 형식이 아니다** — 7월 검증 때 받은 파일명은 `SMES 작업공수관리(일자) _ 7월.xls`, `SMES 부동공수 상세_ 7월.xls`처럼 띄어쓰기·괄호가 들어있었다(README에 적힌 `SMES_작업공수관리일자_7월.xls` 같은 언더스코어 표기와 다름). `config.py`를 고칠 때 실제 파일명을 그대로 복사해 넣을 것.

**`requirements.txt`의 `pandas<3` 고정을 풀지 말 것.** `tests/test_analysis.py`의 회귀값은 pandas 2.x 기준으로 검증됐다. pandas 3.0으로 올리면 `pip install`은 조용히 성공하지만 수치가 달라질 수 있으니, 버전을 바꾸려면 반드시 `pytest`로 7월 값이 그대로인지 먼저 확인한다.

### 웹앱 (`webapp/`, M1~M6 완료, M7 배포 진행 중)
```powershell
cd webapp
npm install
npm run db:migrate      # drizzle-kit migrate — data/agm_oee.sqlite 생성
npm run dev             # 개발 서버 (Turbopack, http://localhost:3000)
npm run ingest:once     # Python 파이프라인 실행 + CSV → SQLite 적재 수동 1회 실행 (검증용, FILES 맵에 등록된 월만)
npm run ingest:run -- --summary <경로> --detail <경로> --year <YYYY> --month <M>   # 임의 파일 경로로 즉시 적재 (SMES 자동화 결과 반영용)
npm run backup:db [-- --retain 14]   # SQLite 스냅샷을 backups/에 저장, 초과분은 오래된 것부터 자동 삭제 (run_daily_update.py가 자동 호출)
npm run db:studio       # Drizzle Studio로 SQLite 내용 확인
npm test                # Vitest 단위 테스트 (lib/ingest.ts, lib/queries.ts, lib/admin.ts) — 별도 테스트 DB 사용
npm run test:e2e        # Playwright 스모크 테스트 (현황판·6대부동 분석·가동율 추이·가동율 비교분석, 전용 포트 3100에 서버 자동 기동)

# 배포(M7) — 사내망에서 다른 PC도 접속 가능하게 프로덕션으로 띄울 때
npm run build
npx pm2 startOrReload ecosystem.config.cjs   # 포트 3000, HOSTNAME 0.0.0.0
npx pm2 restart agm-oee                       # 코드 변경 후 재반영 (먼저 npm run build 필요)
npx pm2 stop agm-oee
```

**`webapp/` 코드를 고치면 그때마다 `npm run build` + `npx pm2 restart agm-oee`까지 해야 실제로 반영된다** — 동료들은 `npm run dev`(개발 서버)가 아니라 PM2가 띄운 프로덕션 빌드(포트 3000)로 접속한다. 소스만 고치고 재빌드/재기동을 안 하면 화면은 그대로다(실제로 한 번 겪음 — "변경되지 않았는데?"). 테스트·린트 통과 후 매번 자동으로 재배포한다(사용자 확정 사항, 허락을 따로 구하지 않음) — git 커밋 단위로 롤백 지점을 남겨두기 때문에(아래) 안심하고 바로 반영해도 된다는 것이 사용자의 결정이다.

**롤백 지점**: UI를 계속 고치다 이전 상태로 되돌리고 싶을 수 있어, 의미 있는 변경마다 `git commit` + `git tag -a verN`(`ver1`, `ver2`, ...)으로 체크포인트를 남긴다(사용자가 "verN으로 커밋해줘"라고 명시적으로 요청할 때만 커밋 — 레포의 git 안전 수칙대로 임의 커밋 금지). `git diff ver1 ver2`로 구간 비교, `git reset --hard verN`으로 그 시점 전체 복원.

### SMES 자동화 (`scripts/smes_automation/`, 사용자가 직접 실행할 때만 동작 — 스케줄러 없음)
```powershell
# 전제: SMES에 이미 로그인된 상태로 창이 화면에 보여야 한다(최소화 아님, 1920x1080 최대화 기준 좌표)
.venv\Scripts\python.exe scripts\smes_automation\run_daily_update.py   # 전일자 다운로드 2종 + 웹앱 SQLite 반영까지 한 번에
# 또는 바탕화면 바로가기: "SMES 데이터 업데이트"(scripts/smes_automation/run_daily_update.bat), "AGM 가동율 대시보드"(scripts/start_dashboard.bat)
```
pywinauto(UIA 백엔드)로 SMES 화면을 실제 마우스 클릭으로 조작한다(현황분석>공수관리 드롭다운 마우스 홀드+이동, 좌표 기반). `_common.py`에 공통 로직(메뉴 탐색, 날짜/공정 필드 입력+검증, CSV 저장)이 있고 `download_detail.py`(부동공수분석-상세, DETAIL_FILE 역할)/`download_summary.py`(작업공수관리(일자별), SUMMARY_FILE 역할)가 화면별 좌표만 다르게 가진다. **"작업공수관리(기간별)" 화면은 쓰지 않는다** — 공정×구분 집계표라 `load_summary()`가 기대하는 `일자별` 컬럼이 없어서 초기에 시도했다가 폐기했다. `.bat` 파일은 반드시 ASCII로만 작성할 것 — 한글 주석이 든 UTF-8(BOM 없음) 배치파일을 한글 Windows `cmd.exe`가 CP949로 잘못 읽어 파일 자체가 깨지는 걸 실제로 겪었다.

`run_daily_update.py`는 적재 성공 뒤 `npm run backup:db`(`webapp/scripts/backup-db.ts` → `lib/admin.ts`의 `createScheduledBackup`)도 같이 호출해 `backups/`에 SQLite 스냅샷을 남긴다. 별도 스케줄러 없이 "SMES 자동화를 직접 실행할 때만 백업도 같이" 만들어지는 방식(사용자 확정 사항). 기본 14개 초과분은 오래된 것부터 자동 삭제되는데, **이건 백업 파일 정리일 뿐 대시보드가 보여주는 실제 데이터(line_day/allocation)와는 무관하다** — 그쪽은 관리자 모드에서 직접 지우지 않는 한 몇 년이 지나도 그대로 조회된다(달력 입력을 쓰는 이유이기도 함).

**과거 달 소급 백필**: `backfill_month.py <year> <month>`(임의 월 1일~말일 통째로 다운로드, 웹앱 적재는 별도로 `npm run ingest:run` 호출 필요) / `backfill_range.py <시작연> <시작월> <끝연> <끝월>`(여러 달 연속 다운로드+적재까지 한 번에, 한 달 실패해도 다음 달로 계속 진행하고 끝에 성공/실패 목록 출력). 실제로 2025-01~2026-06(18개월)을 이 방식으로 한 번에 채워 넣어 검증했다 — **하루 단위(`run_daily_update.py`)든 통째 월 단위든 겹치지 않는 날짜 범위라면 몇 번을 나눠 넣어도 중복·충돌 없이 합쳐진다**(`ingest.ts`가 파일에 실제로 들어있는 날짜만 지우고 다시 넣는 구조라서). 이 규모로 돌릴 때 실제로 겪은 것들:
- **같은 파일명을 재다운로드(재시도)하면 Windows가 "이미 있음, 덮어쓰시겠습니까?" 확인창을 띄우는데 `save_via_csv()`가 이걸 처리하지 못해 멈춘다** — 재시도 전에 `data/raw/`에서 그 달 파일을 지우거나, 멈춰있는 대화상자를 수동으로 닫아줘야 한다. (아직 자동 처리 코드는 없음 — 고칠 거면 `_common.py`의 `save_via_csv()`에 추가)
- **CSV 저장 후 SMES가 자동으로 그 파일을 Excel로 열어서 보여주는데, 다음에 같은 파일명으로 다시 저장하려 하면 "다른 프로세스에서 사용 중" 에러가 난다** — 반복 다운로드(백필처럼 여러 달을 연달아 받을 때) 중간중간 열려 있는 Excel 창들을 정리해줘야 한다.
- 달 하나 전체가 pywinauto 타이밍 이슈로 실패해도(날짜 필드에 이전 값이 남아있는 등) 그 달만 건너뛰고 나머지는 정상 진행되므로, 실패 목록만 따로 재시도하면 된다.

**적재 후 누락 검증 방법**: "빠진 날짜가 있는지" 확인할 땐 DB만 보지 말고 **원본 SMES 파일(`data/raw/`)의 `일자별` 컬럼과 대조**해야 한다 — SMES 자체에 이미 없는 날(공휴일 등 실제로 작업이 없었던 날)과 파이프라인이 유실한 날을 구분해야 하기 때문이다. 실제로 2025-01~2026-06을 이 방식으로 검증했을 때, 원본에 빠진 날(설날 연휴 1/29~30, 현충일 6/6, 추석 연휴 10/6)과 DB에 빠진 날이 정확히 일치해 파이프라인 유실이 없음을 확인했다 — 달력 일수와 DB 일수만 비교하면 이런 정상적인 휴무일까지 "누락"으로 오인하게 되니 주의.

## 핵심 규칙 (사용자 확정 — 임의 변경 금지)
- GC라인·반자동라인은 모든 분석에서 제외한다.
- 라인 명칭: 1~4라인 → "AGM조립1라인" ~ "AGM조립4라인".
- 계획가동시간 1,320분/일 (3조2교대, 11h × 2교대, 휴식 미차감, 주말·휴무일 동일).
- 6대부동(생산·설비·자재·관리·라인언밸런스·부자재교체)만 부동으로 본다.
- 실동부동(FA4)은 분류만 하고 부동에서 뺀다.
- 수동작업(생산·라인언밸런스 중 수동적재·긴급투입 등)은 따로 분류하고 가동율에서 뺀다.
- 라인 배분
  - 단일·복수 라인 표기는 각 라인에 100% 반영한다.
  - 라인 미표기 AGM 공통 부동은 4개 라인에 25%씩 배분한다.
- 시간가동율 = (계획 − 6대부동분) ÷ 계획. 라인 가동율은 시간(분) 기준이고, 공정 지표는 공수 기준이다.
- **가동율 100%(rate===1, 즉 6대부동 0분)는 실제로는 있을 수 없는 값** — 정상 달성이 아니라 그 라인/기간의 부동 데이터 자체가 없다는 신호로 본다. 웹앱에서는 회색 "비가동"으로 표시하고(`lib/status.ts`의 `rateStatus()`), "목표 달성 라인" 집계에서도 제외한다. `rate`가 정수 분(分) 합산에서 나온 값이라 부동소수점 오차 없이 `=== 1` 비교로 판정한다.
- **웹앱에 표시하는 모든 %는 `%` 기호를 붙이고 소수점 1자리까지 반올림한다**(사용자 확정 사항). `toFixed(1)` + `%` 리터럴로 직접 포맷하고, Plotly 차트의 `number`/`hovertemplate`는 `valueformat`/`:.1f`를 명시한다 — 기본값에 맡기면 소수점 자리수가 차트마다 달라진다(예전에 파레토 누적비율 호버가 `.0f`로 남아있던 적이 있었다).

## 구조와 데이터 흐름
- `src/agm/config.py`: 모든 기준값과 경로(파일 경로, 계획시간, 6대부동 매핑, 라인/제외/수동작업 정규식). 기준을 바꿀 때는 여기부터 고친다.
- `src/agm/analysis.py`: 산출 엔진. 새 기능은 여기에 함수로 추가한다. 파이프라인은 `load_summary/load_detail`(원본 읽기) → `classify`(부동 1건마다 대상라인·관리구분 판정) → `allocate`(라인별 배분 테이블 생성) → `line_day`(라인×일자 가동율) → `monthly`(월 합계) 순이며, `run_all()`이 전체를 한 번에 실행하고 결과를 dict로 반환한다(`summary`, `detail`, `alloc`, `line_day`, `monthly`, `pareto`, `kpi`). `run_all(summary_path, detail_path, year, month)`와 `line_day(alloc, plan, year, month, days)`는 인자를 안 주면 `config.py` 기본값과 완전히 같게 동작한다 — 웹앱이 다른 달을 처리할 때만 override한다(M5).
  - `classify()`/`allocate()`는 부동 0건(빈 DataFrame) 입력을 반드시 처리해야 한다 — pandas가 빈 DataFrame에 `.apply(axis=1)`을 쓰면 반환 shape을 잘못 추론해 "여러 컬럼을 단일 컬럼에 대입" 에러가 난다(SMES 자동화로 하루치만 받으면 그날 부동이 0건일 수 있어 실제로 겪음). 두 함수 다 앞부분에 빈 입력 가드가 있다.
  - `line_day()`의 `days` 인자(기본 None → year/month의 달력 전체 채움)는 **하루치만 들어온 데이터를 반영할 때 반드시 넘겨야 한다** — 안 넘기면 조회하지 않은 나머지 날짜까지 "부동 0건=100% 가동"으로 잘못 채워 기존 데이터를 덮어쓴다(실제로 겪음: 하루치 업로드로 그 달 나머지 29일이 100%로 오염됨). `run_all()`은 이미 `summary["일자"]`(그 실행에서 실제로 조회한 날짜들)를 `days`로 넘기도록 고쳐져 있다 — 이 배선을 건드리지 말 것.
- `run_pipeline.py`: `scripts/export_data.py` → `scripts/excel/build_base.py` → `build_summary.py` → `build_agm_lines.py` → `scripts/dashboard/gen_mockups.py` 순서로 실행하는 진입점. 각 스크립트는 독립 실행 가능하며 모두 `output/`에 결과를 쓴다.
- `scripts/export_data.py`: `analysis.run_all()` 결과를 `output/agm_line_day.csv`, `agm_monthly.csv`, `agm_allocation.csv`, `dashboard_data.json`으로 내보낸다. **웹앱/대시보드는 이 산출물을 입력으로 쓴다.**
- `scripts/excel/`: `build_base.py`(원본 대사·일자별 가동율 시트, 엑셀 수식 기반) → `build_summary.py` → `build_agm_lines.py` 3단계로 엑셀 보고서를 만든다. **분류 규칙(라인 추출 정규식, 수동작업 패턴)이 `analysis.py`와 별도로 `build_base.py`에 중복 구현되어 있다** — 분류 규칙을 바꾸면 `config.py`와 `build_base.py`의 `MANUAL` 정규식을 함께 고쳐야 한다(장기적으로는 엔진으로 통합 권장).
- `scripts/dashboard/gen_mockups.py`: `dashboard_data.json`을 읽어 대시보드 UI 목업 5종(HTML/SVG, `output/mockups/`)을 생성한다. 실제 값이 아니라 **디자인 레퍼런스**이며, 웹앱 화면 설계의 초기 기준이었다. ①현황판(Andon) ②설비 상태 타임라인(부동 발생 시각 데이터 없어 임의 배치 — 실사용 불가) ③라인×일 히트맵 ④로스 워터폴/파레토 ⑤추이(소형 다중 차트) — 이 번호·이름은 목업 당시 것으로, 실제 웹앱은 이후 ③히트맵→가동율 비교분석으로 바뀌고 화면 이름도 6대부동 분석/가동율 추이/가동율 비교분석으로 바뀌면서 번호를 뗐다(아래 "화면" 절 참고).
- `tests/test_analysis.py`: 7월 검증값 회귀 테스트. `analysis.run_all()`의 월별 가동율·6대부동 합계·수동작업 제외분·기존 엑셀과의 공식 일치 여부·두 원본 파일 간 정합성을 검증한다. 산출 로직을 바꾸면 반드시 `pytest`로 확인한다.
- `data/raw/`: SMES 원본 `.xls` 2종(작업공수관리일자, 부동공수 상세)을 두는 곳. git에는 포함하지 않는다(`.gitignore`의 `data/raw/`). 월별로 폴더를 나누지 않고 한 곳에 전부 모아두며(예: 7월·8월 원본이 함께 있음), `config.py`의 `SUMMARY_FILE`/`DETAIL_FILE`이 그중 어떤 파일을 쓸지 가리킨다.
- `EBGC 라인가동율 대시보드/`(프로젝트 루트): 기존 "총시간생산성.xlsx"(월별) 등 참고용 자료. git에는 포함하지 않는다(`.gitignore`). 사용자가 로컬에 따로 두는 자료라 다른 환경엔 없을 수 있다.

## 기존 총시간생산성 엑셀과의 대응 (검증 완료)
- 기존 "투입시간"은 SMES "순투입공수"와 같다.
- 기존 "순투입시간"은 우리 "순작업공수"(= 순투입공수 − 6대부동)와 같다.
- 공수가동율 = 1 − 기존 6대부동률이다.
- 7월 수치 차이는 추출 시점 차이다(기존 파일은 7/31 미반영, 설비부동 사후 수정 전).

## 웹앱 (`webapp/`)
Next.js(App Router, TypeScript) + SQLite(Drizzle ORM) 웹 서비스 계층. 계산 로직은 옮기지 않고 Python(`analysis.py`)이 그대로 담당하며, 웹앱은 그 결과를 저장·조회·시각화만 한다(이유는 `TECH_agm-oee.md` 1.1절). 개발 계획·현재 진행 상황은 [PLAN_agm-oee.md](PLAN_agm-oee.md)/[TO-DO_agm-oee.md](TO-DO_agm-oee.md) 참고.

- `webapp/src/db/schema.ts`: Drizzle 테이블 정의(`uploads`, `lineDay`, `allocation`). `lineDay`/`allocation`은 `output/agm_line_day.csv`, `agm_allocation.csv`의 컬럼을 그대로 옮긴 것이라 컬럼을 추가하려면 먼저 `analysis.py`/`export_data.py` 쪽에 값이 있는지부터 확인한다.
- `webapp/src/lib/paths.ts`: 프로젝트 루트·`.venv` 파이썬·`output/` 경로를 계산. `webapp/`이 항상 루트 바로 아래에 있다고 전제(`AGM_OEE_PROJECT_ROOT` 환경변수로 재정의 가능).
- `webapp/src/lib/runPython.ts`: `child_process.execFile`로 `.venv`의 python을 실행해 `scripts/export_data.py`를 돌린다. 실패 시 stderr를 그대로 반환(재계산 로직 없음, 실행만 함).
- `webapp/src/lib/ingest.ts`: `output/agm_line_day.csv`·`agm_allocation.csv`를 읽어 SQLite에 upsert. 같은 날짜의 기존 행은 지우고 다시 넣는 방식이라 재업로드 시 자동으로 덮어써진다. **여기서 가동율을 다시 계산하지 않는다** — 재계산이 필요하면 `analysis.py`를 고쳐야 한다. CSV를 `csv-parse`로 읽을 때 `bom: true`가 반드시 필요하다 — `export_data.py`가 엑셀 호환을 위해 utf-8-sig(BOM 포함)로 저장하는데, BOM을 안 벗기면 첫 컬럼명 앞에 보이지 않는 문자가 붙어 `r["라인"]`이 조용히 `undefined`가 된다(실제로 한 번 겪은 버그).
- `webapp/src/lib/uploadPipeline.ts`: `runPython`+`ingest`를 묶어 `uploads` 테이블 상태(processing→done/error)까지 기록한다. `processUpload()`를 `/upload`의 Server Action, `ingest-once.ts`/`ingest-run.ts`, `/설정` 관리자 모드의 재계산(`lib/admin.ts`의 `recomputeUpload`)까지 전부 재사용한다.
- `webapp/scripts/ingest-once.ts` (`npm run ingest:once [-- --year 2026 --month 8]`): 위 파이프라인 전체를 한 번에 실행하는 수동 검증용 CLI. `FILES` 맵에 그 달 원본 파일명이 등록돼 있어야 한다.
- `webapp/scripts/ingest-run.ts` (`npm run ingest:run -- --summary <경로> --detail <경로> --year <Y> --month <M>`): `ingest-once.ts`와 달리 `FILES` 맵 없이 임의 파일 경로를 그대로 받는다 — SMES 자동화(`scripts/smes_automation/run_daily_update.py`)가 매일 새로 받은 파일을 이걸로 바로 적재한다.
- `webapp/src/lib/admin.ts`: `/설정` 관리자 모드의 파괴적 작업(`deleteUpload`, `resetAll`, `recomputeUpload`, `createBackup`, `createScheduledBackup`). `uploads` 행은 `lineDay`/`allocation`과 FK로 연결돼 있지 않고 연/월로만 대응되므로(`db/schema.ts`), 삭제도 `substr(date,1,7)` 패턴으로 그 달 전체를 지운다 — 업로드 단위가 아니라 사실상 월 단위 삭제다. `createBackup()`(수동 다운로드용, Buffer 반환)과 `createScheduledBackup()`(`backups/`에 파일로 저장 + 오래된 것 자동 삭제, `scripts/backup-db.ts`가 호출) 둘 다 `fs.copyFile`이 아니라 better-sqlite3의 `sqlite.backup()`을 쓴다(WAL 모드에서 단순 복사하면 쓰기 도중 손상된 사본이 될 수 있음).
- `webapp/src/lib/adminUnlock.ts`: 관리자 모드 잠금 상태(`localStorage` + `CustomEvent`). 인증 게이트 없음(사용자 확정 사항 — 사내망 배포라 로고 5연속 클릭만으로 해제). `Sidebar.tsx`(로고 클릭 카운터, 1.5초 안에 5번)와 `SettingsClient.tsx`(잠금 여부에 따라 `AdminPanel` vs 기존 `PlaceholderPage`)가 이걸로 통신한다.
- `webapp/src/lib/period.ts`: ①현황판의 일별/기간별/월별 기간 문자열 유틸(`previousPeriod`, `previousRange`, `addDays`, `daysBetween`). **`Date.toISOString()`을 쓰지 않는다** — UTC 변환 때문에 로컬 자정(KST)이 전날로 밀릴 수 있어(실제로 겪음), `getFullYear`/`getMonth`/`getDate`로 직접 포맷한다.
- `webapp/src/lib/queries.ts`의 `Period` 타입(`string`(`"YYYY-MM"` 또는 `"YYYY-MM-DD"`) `| {from, to}`): `getLineMonthStats`/`getKpiSummary`가 이 타입을 받는다. 문자열 길이(7 vs 10)로 월/일을 구분하는 `periodClause()`가 핵심이라, 다른 화면이 쓰는 `getAvailableMonths` 등 월 전용 함수는 손대지 않고 이 두 함수만 확장했다.
- `webapp/src/app/upload/actions.ts`(Server Action `uploadAction`) + `components/UploadForm.tsx`(`useActionState`): 파일 2종을 받아 `lib/validateUpload.ts`로 1차 형식 검증 → summary 파일의 `일자별` 컬럼에서 연/월 자동 인식(PRD FR-2) → 이미 있는 달이면 `needs-confirm` 상태로 멈추고, 사용자가 파일을 **다시 선택**하고 확인 버튼을 눌러야 진행된다(FR-3) — 브라우저가 Server Action 응답 후 `<input type=file>`을 비우기 때문에 재선택이 실제로 필요하다(한 번 겪고 확인함). 통과하면 `data/raw/upload_<연>-<월>_{summary,detail}.xls`로 저장 후 `uploadPipeline.processUpload()` 호출.
- `webapp/src/lib/validateUpload.ts`: SheetJS(`xlsx`)로 헤더 행만 읽어 필수 컬럼 확인. **npm에 공개된 `xlsx` 패키지는 패치 안 된 고위험 취약점(프로토타입 오염·ReDoS)이 있어 쓰지 않는다** — `package.json`의 `xlsx`는 `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`(SheetJS 공식 CDN, 패치됨)를 가리킨다. 업데이트할 때도 이 CDN에서 최신 버전을 받을 것, `npm install xlsx`로 되돌리지 말 것.
- `/upload` 페이지는 `export const dynamic = "force-dynamic"`이 붙어 있다 — DB를 읽지만(`getUploadHistory`) searchParams 같은 동적 신호가 없어 Next가 빌드 타임에 정적 스냅샷으로 굳힐 수 있어서다.
- `webapp/CLAUDE.md`/`webapp/AGENTS.md`: Next.js가 `next dev`/`next build` 때마다 자동으로 다시 써넣는 파일(버전별 API 차이를 알려주는 용도). 손으로 고치지 않는다.

### 화면 (`webapp/`)
- 사이드바 순서·명칭(`lib/nav.ts`): 현황판 → (분석 그룹) 6대부동 분석(`/loss`) → 가동율 추이(`/trend`) → 가동율 비교분석(`/compare`) → (관리 그룹) 업로드 → 설정. 예전 이름/순서(로스→추이→비교분석, 동그라미 번호 ③④⑤)는 폐기했다 — 화면 제목에 번호를 안 붙이는 게 사용자 확정 사항이라 코드·주석에서 번호를 보면 최신화가 안 된 것이다(①현황판만 번호를 유지한다).
- `webapp/src/lib/queries.ts`: 화면이 쓰는 집계 쿼리(`getAvailableMonths`, `getAvailableDates`, `getLineMonthStats`, `getKpiSummary`, `getLossBreakdown`, `getPareto`, `getTrendSeries`, `getTopLossDetails` 등). SQLite에서 직접 SQL로 집계하며(`sql` 템플릿), `analysis.py`가 이미 계산해둔 `six_loss_total`/`operating_rate` 등을 다시 계산하지 않고 그대로 합산만 한다. `Period` 타입(`string`("YYYY-MM"/"YYYY-MM-DD") `| {from, to}`)과 이를 SQL where절로 바꾸는 `periodClauseCol(col, period)`(컬럼 인자를 받는 제네릭 버전, `periodClause`는 `lineDay.date`로 고정한 래퍼)를 `getLineMonthStats`/`getKpiSummary`/`getLossBreakdown`/`getPareto`/`getTrendSeries`/`getTopLossDetails`가 전부 공유한다 — 홈·로스·추이 세 화면이 같은 일별/기간별/월별 개념을 쓰는 이유. `LineFilter`(`"all"` 또는 라인명 하나)가 6대부동 분석·가동율 추이 공통 라인 필터(FR-13)의 기준 타입이다.
- `webapp/src/components/PeriodFilterBar.tsx`(예전 이름 `HomeFilterBar.tsx`): 현황판·6대부동 분석·가동율 추이가 공유하는 일별/기간별/월별 필터(`basePath` prop으로 제출 대상 경로만 바꿈, `extraFields`로 화면별 추가 입력—라인 선택·목표 가동율·파레토 TOP N—을 폼 안에 끼워 넣음). 날짜 `<select>` 대신 브라우저 기본 달력(`<input type="date">`/`type="month">`)을 쓴다 — 데이터가 몇 년치 쌓이면 `<select>` 목록이 감당 안 돼서(실제로 지적받음) 바꿨다. 가동율 비교분석(`CompareFilterBar.tsx`)은 전일/전월/전년 비교라는 다른 개념이라 이 공용 필터를 쓰지 않고 별도로 남아 있다.
- `webapp/src/app/page.tsx`(①현황판)는 `searchParams`(Next 16이라 `Promise`, `await` 필요)로 `mode`(`day`/`range`/`month`)·`period`·`from`·`to`·`target`을 받는 **Server Component**다. 선택한 기간에 데이터가 없으면(`kpi.totalLineDays === 0`) 억지로 0%를 보여주지 않고 "데이터가 없습니다"로 안내한다. 일별/기간별/월별·날짜·목표치 선택은 `HomeFilterPersist.tsx`(`"use client"`, 렌더될 때마다 `document.cookie`에 현재 상태를 미러링)로 `lib/homeFilterCookie.ts`가 정의한 쿠키(`home_filter`)에 저장된다 — `page.tsx`는 쿼리스트링이 비어 있으면(사이드바에서 그냥 "현황판"을 눌러 돌아온 경우) 이 쿠키값을 기본값으로 쓴다. 쿼리스트링이 있으면(사용자가 방금 필터를 바꾼 경우) 그게 항상 우선한다.
- 차트가 필요한 곳(`Gauge`, `LineComparisonChart`, `LossCompositionBar`, `WaterfallChart`, `ParetoChart`, `TrendChart`)은 전부 `Plot.tsx`를 통해 각자 `"use client"` + `next/dynamic({ssr:false})`로 불러온다. `Gauge`는 고정 px 대신 `useResizeHandler` + `style={{width:"100%"}}`로 카드 폭에 맞춰 반응형으로 커지게 한다(다른 Plotly 컴포넌트와 같은 패턴). `LineStatusCard`가 `Gauge`+`TopLossBars`(순수 CSS)를 묶어 카드 하나를 만든다. 일자별 스파크라인(`Sparkline`)은 게이지와 정보가 중복된다는 이유로 삭제했다 — 되살릴 필요 없음.
- **Plotly의 bar/waterfall류 트레이스는 `marker.color`에 CSS `var(--color-*)`를 넣어도 해석이 안 된다** — SVG `fill`을 presentation attribute로 그려서 브라우저가 커스텀 프로퍼티를 못 읽는다(반면 `layout.font.color`처럼 텍스트에 적용되는 색은 inline style이라 `var()`가 정상 동작한다). 실제로 `LineComparisonChart`가 이 버그로 현재/비교기간 막대가 둘 다 검정으로 렌더링된 적이 있다 — 데이터 색(막대·마커 `marker.color`)은 항상 리터럴 hex로 쓸 것. `lib/lossCategories.ts`의 `LOSS_CATEGORY_COLOR`(부동유형별 고정 hex, 라벨 키)를 `LossCompositionBar`·`WaterfallChart`가 같이 써서 같은 화면 안에서 부동유형 색이 서로 어긋나지 않는다.
- `WaterfallChart.tsx`는 Plotly의 `type:"waterfall"` 트레이스가 아니라 **`type:"bar"` + 포인트별 `base`(누적 시작점) 배열**로 계단식 막대를 직접 쌓는다 — waterfall 트레이스는 `increasing`/`decreasing`/`totals` 단위로만 색을 지정할 수 있어 6개 부동유형마다 다른 색(`LOSS_CATEGORY_COLOR`)을 줄 방법이 없었다. 대신 waterfall 특유의 계단 연결선(connector)은 없다.
- `TopLossBars.tsx`(①현황판 라인 카드의 "부동 TOP3")·`ParetoChart.tsx`(6대부동 분석의 파레토)는 둘 다 마우스 호버에 엑셀 원본 "부동내역" 수준의 상세를 보여준다. `TopLossBars`는 `getLineMonthStats`가 채워주는 `topLosses[].details`(그 부동유형 안에서 가장 큰 부동내역 상위 3건, `getTopLossDetails` 쿼리)를 순수 CSS `group-hover` 툴팁으로 띄우고, 상세가 없으면(0분 등) 유형명 자체를 보여준다. `ParetoChart`는 `getPareto`가 반환하는 `ratio`(전체 부동 대비 그 항목의 비중, `cumulativeRatio`와 별개)를 `customdata`로 넘겨 호버에 "N위 · 항목명 · 분 (전체 부동의 X.X%)"를 표시한다.
- `webapp/src/app/settings/`: 5클릭으로 풀리는 관리자 모드. `page.tsx`(Server, `getUploadHistory`) → `SettingsClient.tsx`(잠금 여부에 따라 `AdminPanel` 또는 `PlaceholderPage`) → `AdminPanel.tsx`(`"use client"`, `useTransition`으로 `settings/actions.ts`의 Server Action 직접 호출 — `<form>` 없이 버튼 `onClick`에서 바로 부름). 파괴적 버튼은 전부 `window.confirm()`으로 1차 확인(전체 초기화는 2번). 백업 다운로드는 `/api/admin/backup`(GET, `lib/admin.ts`의 `createBackup()`).
- `/api/export/line-day`, `/api/export/allocation`(route handler): CSV 내보내기(FR-14, `ExportLinks`). PNG는 별도 구현 없이 Plotly 차트 툴바의 기본 카메라 아이콘(`config.displayModeBar: true`)으로 대체했다. 6대부동 분석·가동율 추이가 일별/기간별 모드일 땐 CSV 내보내기가 특정 월 하나로 못 좁혀지므로 `month=all`(전체 기간)로 내보낸다 — 월별 모드일 때만 그 달로 좁혀진다.
- **히트맵 화면은 제거했다** — 사용자 확정 사항으로 "가동율 비교분석"(`/compare`, `CompareFilterBar`+`LineComparisonChart`)으로 교체. `HeatmapChart`/`CategoryHeatmap`/`getHeatmapData`/`getDayDetail`/`/api/day-detail`가 전부 이때 같이 삭제됐다 — 혹시 남아있는 참조를 보면 죽은 코드다. (참고로 겪었던 교훈: Plotly 이름 있는 colorscale('RdYlGn', 'Blues')은 기대와 반대 방향으로 렌더된다 — 나중에 다시 히트맵류를 추가하면 `[[0,색],[1,색]]` 배열로 직접 지정하고 스크린샷으로 방향을 먼저 확인할 것.)
- `webapp/src/app/compare/`(가동율 비교분석): 일별/월별/연도별 세 모드로 라인별 시간가동율을 현재 vs 비교기간(전일/전월/전년)으로 막대 그래프 비교한다. `lib/period.ts`의 `previousPeriod`/`previousYear`로 비교 대상 기간을 구하고, 두 기간 모두 기존 `getLineMonthStats(period)`를 그대로 재사용한다(새 쿼리 함수 없음). `LineComparisonChart`가 `rate===1`(비가동)과 `planMinutes===0`(그 기간 데이터 자체 없음)을 구분해서 각각 "비가동"/"데이터 없음" 회색 막대로 표시한다.
- `queries.ts`에서 클라이언트 컴포넌트가 import할 상수(`LOSS_LABELS`, `LOSS_CATEGORY_COLOR` 등)는 `lib/lossCategories.ts`처럼 **`db`를 import하지 않는 별도 파일**에 둔다. `queries.ts` 자체를 클라이언트 컴포넌트가 import하면(타입이 아니라 값을) `better-sqlite3`가 브라우저 번들에 딸려가 "Can't resolve 'fs'"로 빌드가 깨진다(실제로 겪음). `import type`은 컴파일 시 지워지므로 타입만 가져오는 건 괜찮다.

### 디자인 시스템 연동 (`webapp/`)
- Tailwind v4는 CSS 기반 설정이라 `tailwind.config.ts`가 없다 — 토큰은 `webapp/src/app/globals.css`의 `@theme inline` 블록에 있다.
- `sebang.css` 원본(`sebang_design_system_2/sebang-design-system/sebang.css`)은 Turbopack이 `webapp/` 바깥 경로를 CSS `@import` 하지 못하게 막아서, `npm run sync:design`(`scripts/sync-design.mjs`, `postinstall`로 자동 실행)이 `webapp/public/design/sebang.css`로 복사해두면 `layout.tsx`가 `<link>`로 읽는다. **원본을 고치면 `npm run sync:design`을 다시 실행해야 반영된다** — `public/design/`은 git에 커밋하지 않는다.
- `globals.css`의 `@theme inline`은 `sebang.css`가 정의한 `--color-*` 변수를 그대로 다시 노출해 `bg-bg-base`, `text-accent-primary` 같은 Tailwind 유틸리티를 만든다. `@custom-variant dark`가 `data-theme="dark"` 속성 기준으로 `dark:` 유틸리티를 켠다(시스템 설정이 아님). `design.md` 3.3절 타입 스케일(`text-h1` 등)은 `@utility`로 추가했다.
- `components/ThemeToggle.tsx`는 React state로 테마를 추적하지 않는다 — `<html data-theme>`을 직접 읽고/쓰고 CSS(`dark:hidden` 등)로 보이는 라벨만 바꾼다. React state로 만들면 (레이아웃의 인라인 스크립트가 hydration 전에 미리 정해둔 값과 어긋나) hydration mismatch가 난다.
- 사이드바 네비게이션은 `lib/nav.ts`의 그룹 배열로만 정의된다. 화면을 추가하려면(생산성지표, OEE 등) 여기에 그룹/항목만 추가하면 된다 — 사용자가 UI 단계에서 화면·기능이 계속 늘어날 것이라고 확인했다.
- `webapp/src/components/AppShell.tsx`: `<main>` 우측 하단에 `public/images/rocketboy.png`("로켓보이" SEBANG 마스코트 — 헬멧·가슴에 "R" 로고가 있는 벡터 일러스트, 사용자 제공 이미지에서 배경만 플러드필로 제거)를 `position:fixed` + `opacity-15` + `pointer-events-none`으로 깔아 전 화면 공통 워터마크로 쓴다. **콘텐츠(`z-0`)보다 위(`z-20`)에 온다** — 처음엔 콘텐츠 뒤에 뒀는데, 카드(`bg-bg-surface`, 불투명)가 화면을 꽉 채우는 화면에서는 완전히 가려져 사실상 안 보였다(실제로 지적받음). `pointer-events-none`이라 위에 있어도 클릭/스크롤은 그대로 카드가 받는다. `Sidebar.tsx`의 SEBANG 로고도 `h-6`→`h-10`로 키워 CI를 더 크게 노출한다.
  - **이미지 파일(`rocketboy.png`)을 같은 파일명으로 교체할 때는 두 겹의 캐시를 다 신경 써야 한다.** (1) 서버 쪽: `rm -rf webapp/.next/cache/images` 하고 다시 `build`해야 한다 — Next.js `next/image` 최적화 결과가 `.next/cache/images/`에 디스크 캐시로 남아있어서 `npm run build` + `pm2 restart`만으로는 예전 이미지의 캐시된 렌더(`.webp`)가 계속 서빙될 수 있다. (2) 브라우저 쪽: `/_next/image?...` 응답이 `Cache-Control: public, max-age=14400`(4시간)이라 서버를 고쳐도 이미 그 화면을 한 번이라도 본 브라우저는 서버에 재확인도 안 하고 예전 캐시를 계속 보여준다 — 그래서 `AppShell.tsx`의 `<Image src="/images/rocketboy.png?v=N">`처럼 쿼리스트링에 버전을 붙여뒀다. **이미지를 교체할 때마다 이 버전 숫자(`ROCKETBOY_VERSION`)를 올려야** URL 자체가 바뀌어서 브라우저 캐시를 확실히 우회한다(실제로 겪음: 서버는 새 이미지를 정상적으로 주는데도 사용자 브라우저엔 예전 이미지가 계속 보였다). 이 값을 바꾸면 **`next.config.ts`의 `images.localPatterns[].search`도 같은 값으로 같이 고쳐야 한다** — Next.js `localPatterns`의 `search`는 와일드카드(`*`)를 지원하지 않고 정확히 일치해야 하는 값이라(실제로 `"?v=*"`로 써봤다가 이미지가 전부 400으로 깨졌다), 버전만 올리고 이 설정을 안 맞추면 이미지 자체가 안 뜬다.
- 차트는 `react-plotly.js`+`plotly.js-dist-min`(전체 trace 포함, 용량만 최소화) 하나로 통일한다(`components/Plot.tsx`). Plotly는 `document`에 접근해 SSR이 안 되므로, 쓰는 곳은 반드시 `"use client"` 컴포넌트 안에서 `next/dynamic(..., { ssr: false })`로 불러온다. 실제로 차트를 그리는 곳은 `Plot.tsx`를 직접 쓰지 않고 `components/AnimatedPlot.tsx`를 dynamic import한다 — 막대 트레이스에 음영 테두리(`marker.line`)와 차트 전체에 CSS `drop-shadow`를 입혀 입체감을 주고, mount 시 값을 0에서 실제값으로 바꿔치기해 `layout.transition`(indicator는 트레이스 자체의 `transition`)으로 부드럽게 자라나는 진입 애니메이션을 재생한다(사용자 확정 사항 — 3D 차트가 아니라 순수 시각 효과). 새 차트를 추가할 때도 `Plot` 대신 `AnimatedPlot`을 쓸 것.

### 테스트 (`webapp/`)
- Vitest(`src/lib/__tests__/`)는 `webapp/data/agm_oee.sqlite`(개발 DB)를 절대 건드리지 않는다 — `vitest.config.mts`가 `AGM_OEE_PROJECT_ROOT`/`AGM_OEE_DB_PATH`를 `.vitest-scratch/`(테스트 실행마다 새로 만들고 끝나면 지움)로 override하고, `vitest.global-setup.mts`가 그 안에 `drizzle-kit migrate`로 스키마를 만든다. 새 테스트를 추가할 때 이 env를 직접 바꾸지 말 것 — `db`/`paths`가 이미 그 값을 읽게 되어 있다.
- 여러 워커가 같은 SQLite(WAL) 파일을 동시에 열면 "database is locked"가 난다 — `fileParallelism: false`로 파일 단위 직렬 실행 중(실제로 겪은 문제).
- `vitest.config.mts`의 `include: ["src/**/*.test.ts"]`를 지우지 말 것 — 없으면 Vitest가 `tests/e2e/*.spec.ts`(Playwright 전용)까지 주워가서 깨진다(실제로 겪음).
- Playwright(`tests/e2e/`, `playwright.config.ts`)는 사내망 배포 전 로컬 스모크 테스트용이며, **개발 DB에 이미 적재된 실데이터**를 그대로 읽는다(별도 픽스처 없음) — 포트 3100에서 Playwright가 `npm run dev`를 직접 띄우고 끝나면 종료한다. 화면에 표시되는 정확한 수치가 아니라 "로드되는지·필터를 바꿔도 안 깨지는지"만 확인하는 스모크 테스트다.

## 다음 할 일
- 대시보드 웹앱(현황판·6대부동 분석·가동율 추이·가동율 비교분석 화면, 업로드, 관리자 모드)과 SMES 자동 다운로드(`scripts/smes_automation/`)는 완료. PM2+DuckDNS+방화벽으로 사내망 공유·정기 백업까지는 됐고, 상시 켜진 전용 서버(또는 클라우드)로의 이전과 관리자 모드 인증 추가는 사용자가 "일단 남겨두자"고 명시적으로 보류한 상태다. 진행 상황은 [TO-DO_agm-oee.md](TO-DO_agm-oee.md) 참고.
- 생산실적·25년 라우팅·파견 상세를 추가해 원단위와 총시간 생산성을 산출한다.
- 부동 발생시각을 확보한 뒤 설비 상태 타임라인(②)과 OEE로 확장한다.

## 디자인 시스템 (세방 CI)
- `sebang_design_system_2/sebang-design-system/sebang.css`: 링크하면 즉시 적용되는 CSS(브랜드 색상 변수, SEBANG Gothic 폰트가 base64로 내장됨, `data-theme="dark"`로 다크모드 전환). 웹앱 화면에 `<link rel="stylesheet">`로 걸어야 실제로 적용된다 — 넣어두기만 해서는 반영 안 됨.
- `design.md`(프로젝트 루트): 색상·타이포·간격·컴포넌트·접근성 규칙과 로고 SVG 원본. 사람이 읽고 규칙을 따르기 위한 문서이며 자동 적용되지 않는다. `sebang.css`의 토큰과 1:1 대응하도록 유지해야 한다.

## 코딩 규칙
- 한글 컬럼명은 SMES 원본을 그대로 쓴다. 단, 공백은 제거한다(예: '인   원' → '인원').
- 파일 입출력은 UTF-8로 하고, CSV는 엑셀 호환을 위해 utf-8-sig로 저장한다.
