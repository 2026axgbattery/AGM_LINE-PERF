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

새 달 데이터를 돌릴 때는 `data/raw/`에 SMES 원본 2종을 넣고 `src/agm/config.py`의 `SUMMARY_FILE`, `DETAIL_FILE`, `EXCEL_OUT`, `MONTH`를 수정한 뒤 `python run_pipeline.py`를 실행한다.

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

## 구조와 데이터 흐름
- `src/agm/config.py`: 모든 기준값과 경로(파일 경로, 계획시간, 6대부동 매핑, 라인/제외/수동작업 정규식). 기준을 바꿀 때는 여기부터 고친다.
- `src/agm/analysis.py`: 산출 엔진. 새 기능은 여기에 함수로 추가한다. 파이프라인은 `load_summary/load_detail`(원본 읽기) → `classify`(부동 1건마다 대상라인·관리구분 판정) → `allocate`(라인별 배분 테이블 생성) → `line_day`(라인×일자 가동율) → `monthly`(월 합계) 순이며, `run_all()`이 전체를 한 번에 실행하고 결과를 dict로 반환한다(`summary`, `detail`, `alloc`, `line_day`, `monthly`, `pareto`, `kpi`).
- `run_pipeline.py`: `scripts/export_data.py` → `scripts/excel/build_base.py` → `build_summary.py` → `build_agm_lines.py` → `scripts/dashboard/gen_mockups.py` 순서로 실행하는 진입점. 각 스크립트는 독립 실행 가능하며 모두 `output/`에 결과를 쓴다.
- `scripts/export_data.py`: `analysis.run_all()` 결과를 `output/agm_line_day.csv`, `agm_monthly.csv`, `agm_allocation.csv`, `dashboard_data.json`으로 내보낸다. **웹앱/대시보드는 이 산출물을 입력으로 쓴다.**
- `scripts/excel/`: `build_base.py`(원본 대사·일자별 가동율 시트, 엑셀 수식 기반) → `build_summary.py` → `build_agm_lines.py` 3단계로 엑셀 보고서를 만든다. **분류 규칙(라인 추출 정규식, 수동작업 패턴)이 `analysis.py`와 별도로 `build_base.py`에 중복 구현되어 있다** — 분류 규칙을 바꾸면 `config.py`와 `build_base.py`의 `MANUAL` 정규식을 함께 고쳐야 한다(장기적으로는 엔진으로 통합 권장).
- `scripts/dashboard/gen_mockups.py`: `dashboard_data.json`을 읽어 대시보드 UI 목업 5종(HTML/SVG, `output/mockups/`)을 생성한다. 실제 값이 아니라 **디자인 레퍼런스**이며, 다음 개발 대상인 웹앱 화면 설계의 기준이다. ①현황판(Andon) ②설비 상태 타임라인(부동 발생 시각 데이터 없어 임의 배치 — 실사용 불가) ③라인×일 히트맵 ④로스 워터폴/파레토 ⑤추이(소형 다중 차트).
- `tests/test_analysis.py`: 7월 검증값 회귀 테스트. `analysis.run_all()`의 월별 가동율·6대부동 합계·수동작업 제외분·기존 엑셀과의 공식 일치 여부·두 원본 파일 간 정합성을 검증한다. 산출 로직을 바꾸면 반드시 `pytest`로 확인한다.
- `data/raw/`: SMES 원본 `.xls` 2종(작업공수관리일자, 부동공수 상세)을 두는 곳. 매월 교체되며 git에는 포함하지 않는다(`.gitignore` 확인).

## 기존 총시간생산성 엑셀과의 대응 (검증 완료)
- 기존 "투입시간"은 SMES "순투입공수"와 같다.
- 기존 "순투입시간"은 우리 "순작업공수"(= 순투입공수 − 6대부동)와 같다.
- 공수가동율 = 1 − 기존 6대부동률이다.
- 7월 수치 차이는 추출 시점 차이다(기존 파일은 7/31 미반영, 설비부동 사후 수정 전).

## 다음 할 일
1. 대시보드 웹앱(Streamlit 권장)을 만든다. 첫 화면은 ①, 상세 화면은 ③④⑤로 구성한다. 요구사항은 [PRD_agm-oee.md](PRD_agm-oee.md) 참고(②설비 상태 타임라인은 부동 발생 시각 데이터가 없어 이번 범위 제외).
2. 여러 달 데이터와 누계를 처리한다.
3. 생산실적·25년 라우팅·파견 상세를 추가해 원단위와 총시간 생산성을 산출한다.
4. 부동 발생시각을 확보한 뒤 설비 상태 타임라인과 OEE로 확장한다.

## 디자인 시스템 (세방 CI)
- `sebang_design_system_2/sebang-design-system/sebang.css`: 링크하면 즉시 적용되는 CSS(브랜드 색상 변수, SEBANG Gothic 폰트가 base64로 내장됨, `data-theme="dark"`로 다크모드 전환). 웹앱 화면에 `<link rel="stylesheet">`로 걸어야 실제로 적용된다 — 넣어두기만 해서는 반영 안 됨.
- `design.md`(프로젝트 루트): 색상·타이포·간격·컴포넌트·접근성 규칙과 로고 SVG 원본. 사람이 읽고 규칙을 따르기 위한 문서이며 자동 적용되지 않는다. `sebang.css`의 토큰과 1:1 대응하도록 유지해야 한다.

## 코딩 규칙
- 한글 컬럼명은 SMES 원본을 그대로 쓴다. 단, 공백은 제거한다(예: '인   원' → '인원').
- 파일 입출력은 UTF-8로 하고, CSV는 엑셀 호환을 위해 utf-8-sig로 저장한다.
