# AGM 조립 1~4라인 가동율 분석 (agm-oee)

SMES 원본 2종(작업공수관리일자, 부동공수 상세)을 읽어 **AGM 조립 1~4라인의 일자별 시간가동율**을 계산합니다.
결과는 엑셀 보고서, 분석용 CSV/JSON, 대시보드 UI 참고 이미지로 만듭니다.

## 1. 처음 설정 (Windows 기준, 1회)

1. **설치**: [Python 3.11+](https://www.python.org/downloads/) (설치 시 "Add to PATH" 체크), [VS Code](https://code.visualstudio.com/), (PPT 생성 시) [Node.js LTS](https://nodejs.org/)
2. 압축을 풀고 VS Code → **파일 > 폴더 열기** → `agm-oee` 폴더 선택
3. 오른쪽 아래 "권장 확장 설치" 알림 → **설치** (Python, Claude Code 등)
4. VS Code 터미널(``Ctrl+` ``)에서:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
# (선택) 대시보드 PNG 캡처용
playwright install chromium
# (선택) 검증 PPT 생성용
npm install
```

5. `Ctrl+Shift+P` → **Python: Select Interpreter** → `.venv` 선택

## 2. 실행

| 하고 싶은 것 | 방법 |
|---|---|
| 전체 실행 (데이터 → 엑셀 → 대시보드 HTML) | `run_pipeline.py` 열고 **F5**, 또는 `python run_pipeline.py` |
| 분석 데이터만 (CSV·JSON) | `python scripts/export_data.py` |
| 대시보드 예시 PNG | `python scripts/dashboard/screenshot.py` |
| 검증 보고서 PPT | `npm run ppt` |
| 계산 검증 테스트 | VS Code 왼쪽 **테스트(플라스크 아이콘)** → ▶, 또는 `pytest` |

결과는 모두 `output/` 폴더에 생깁니다.

## 3. 폴더 구조

```
agm-oee/
├─ data/raw/                  ← SMES에서 받은 원본 .xls (매월 교체)
├─ src/agm/
│   ├─ config.py              ← ★ 경로·계획시간(1,320분)·목표·분류 규칙
│   └─ analysis.py            ← ★ 산출 엔진 (분류 → 배분 → 가동율). 앞으로 개발의 중심
├─ scripts/
│   ├─ export_data.py         ← 엔진 결과 → CSV/JSON
│   ├─ excel/                 ← 엑셀 보고서 3단계 생성 (수식 포함)
│   ├─ dashboard/             ← 대시보드 UI 예시 5종 (HTML → PNG)
│   └─ verify_ppt/build.js    ← 산출방식 검증 PPT
├─ tests/test_analysis.py     ← 7월 검증값 회귀 테스트
├─ docs/mockups/              ← 대시보드 예시 이미지 5종
├─ run_pipeline.py            ← 전체 실행
└─ CLAUDE.md                  ← Claude Code가 읽는 프로젝트 설명
```

## 4. 산출 기준 (2026-07 확정)

- **대상**: EBGC조립(P51) 중 AGM 조립 1~4라인. GC·반자동라인은 제외합니다.
- **계획가동시간**: 1,320분/일 (3조2교대, 교대당 8h + 잔업 3h = 11h × 2교대, 휴식 미차감, 주말 동일)
- **시간가동율** = (계획가동시간 − 6대부동 시간) ÷ 계획가동시간 (0% 하한)
- **6대부동만 반영**: 생산, 설비, 자재, 관리(형명·금형), 라인언밸런스, 부자재교체
- **실동부동은 분류만 합니다.** 부동으로 보지 않습니다.
- **수동작업은 분리해 가동율에서 제외합니다.** 생산·라인언밸런스 중 수동적재, 긴급투입 등이 해당합니다.
- **라인 배분 규칙**
  - 단일 라인 표기: 해당 라인에 100% 반영
  - 복수 라인 표기("2,4라인"): 각 라인에 100% 반영
  - 라인 미표기 AGM 공통: 4개 라인에 25%씩 배분
- **7월 결과**: 1라인 90.2%, 2라인 91.4%, 3라인 90.0%, 4라인 88.5%, 종합 90.0%

## 5. 다음 달 데이터로 돌리기

1. SMES에서 두 파일을 받아 `data/raw/`에 넣습니다.
2. `src/agm/config.py`에서 `SUMMARY_FILE`, `DETAIL_FILE`, `EXCEL_OUT`, `MONTH`를 수정합니다.
3. `python run_pipeline.py`를 실행합니다.
4. `tests/test_analysis.py`의 기대값은 7월 기준입니다. 새 달에는 테스트를 복사해 값을 바꾸거나 7월 파일로만 돌리세요.

## 6. 개발 로드맵 (제안)

| 단계 | 내용 | 도구 |
|---|---|---|
| 1 | 여러 달 파일 자동 인식, 누계 산출 | pandas (analysis.py 확장) |
| 2 | 대시보드 웹앱: ① 현황판 + ③ 히트맵 + ④ 로스 + ⑤ 추이 | Streamlit (가장 빠름) 또는 FastAPI + React |
| 3 | 생산실적·라우팅·파견 상세 추가 → 원단위·총시간 생산성 | analysis.py에 함수 추가 |
| 4 | 부동 발생시각 확보 → ② 설비 상태 타임라인, 라인별 OEE | SMES/POP 연계 |

## 7. 알아둘 점

- 엑셀 생성 스크립트(`scripts/excel/`)에는 분류 규칙이 따로 들어 있습니다. 규칙을 바꾸면 `config.py`와 `build_base.py`의 `MANUAL` 정규식을 함께 수정하세요. 이후에는 엔진(`analysis.py`)으로 통합하는 것을 권장합니다.
- 엑셀 파일은 열 때 자동으로 재계산되도록 설정되어 있습니다. 처음 열 때 "편집 사용"을 누르세요.
- 기존 "26년 7월 총시간생산성.xlsx"와의 비교 결과는 `output/AGM라인_가동율_산출방식_검증.pptx`에 있습니다.
