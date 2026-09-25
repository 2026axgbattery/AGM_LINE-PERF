# PLAN_agm-oee.md — 웹앱 개발 계획서

- 문서 버전: v1.0
- 작성일: 2026-09-25
- 관련 문서: [PRD_agm-oee.md](PRD_agm-oee.md), [TECH_agm-oee.md](TECH_agm-oee.md), [CLAUDE.md](CLAUDE.md), [design.md](design.md)
- 진행 체크리스트: [TO-DO_agm-oee.md](TO-DO_agm-oee.md)

## 0. 진행 전제

- 계산 로직(`src/agm/analysis.py`)은 이미 검증 완료 상태이며 이번 계획에서 변경하지 않는다. 웹앱은 **저장(SQLite)·조회·시각화 계층**만 신규 개발한다(TECH 1.1절).
- 개발은 `webapp/` 하위 폴더에서 진행하고 기존 Python 프로젝트 구조를 건드리지 않는다(TECH 8.2절 폴더 구조).
- 각 단계는 앞 단계 산출물 위에서 진행되는 순차 구조이며, 단계별로 "완료 기준(DoD)"을 만족해야 다음 단계로 넘어간다.

## 1. 마일스톤 개요

| 단계 | 이름 | 목표 |
|---|---|---|
| M0 | 프로젝트 뼈대 | Next.js + SQLite 앱이 로컬에서 뜬다 |
| M1 | 데이터 적재 파이프라인 | 업로드 → Python 실행 → SQLite 적재까지 동작 |
| M2 | 디자인 시스템 연동 | 세방 CI 토큰·폰트가 실제로 적용된 공통 레이아웃 |
| M3 | 화면 ① 현황판 | 첫 화면 완성, 실데이터로 렌더링 |
| M4 | 화면 ③④⑤ | 히트맵·로스·추이 화면 완성 (드릴다운 포함) |
| M5 | 업로드/에러 처리 UX | 비개발자가 파일만 올리면 끝나는 흐름 완성 |
| M6 | 테스트·내보내기 | Vitest/Playwright, PNG/CSV 내보내기 |
| M7 | 배포 | 사내망 서버에 PM2로 운영 배포 |

---

## M0. 프로젝트 뼈대

**목표**: `webapp/`에 Next.js(App Router, TypeScript) 프로젝트를 생성하고, SQLite 연결과 최소 페이지 하나가 로컬에서 뜨는 상태.

- Node.js 22 LTS 설치 확인, `webapp/` 폴더에 Next.js 프로젝트 생성(App Router, TS, Tailwind 포함 옵션)
- `better-sqlite3`, `drizzle-orm`, `drizzle-kit` 설치
- `db/schema.ts` 초안 작성(TECH 4.2절 테이블 3종: uploads, line_day, allocation)
- `drizzle-kit`으로 첫 마이그레이션 생성 → `data/agm_oee.sqlite` 생성 확인
- 빈 대시보드 레이아웃 페이지(`app/layout.tsx`, `app/page.tsx`) 하나로 `npm run dev` 정상 구동 확인

**완료 기준(DoD)**: `npm run dev`로 접속 시 빈 페이지가 뜨고, SQLite 파일이 생성되며 테이블 3개가 존재한다.

---

## M1. 데이터 적재 파이프라인

**목표**: SMES 원본 업로드 없이도, 기존 7월 데이터를 기준으로 "Python 실행 → CSV → SQLite" 흐름이 스크립트 레벨에서 동작.

- `lib/runPython.ts`: `child_process.execFile`로 `.venv`의 python을 호출해 `scripts/export_data.py`를 실행하는 함수 작성
- `lib/ingest.ts`: `output/agm_line_day.csv`, `output/agm_allocation.csv`를 읽어 `line_day`/`allocation` 테이블에 upsert하는 함수 작성 (재계산 없이 그대로 적재, TECH 5장)
- `uploads` 테이블에 상태(`processing`/`done`/`error`) 기록 로직 작성
- CLI 스크립트나 간단한 테스트 라우트로 "7월 데이터 → SQLite 적재"를 1회 수동 실행해 검증
- 실패 케이스(분류 경고, "부동>계획" 등 `line_day()`의 `확인` 컬럼) 처리 방식 설계 — PRD FR-5

**완료 기준(DoD)**: 7월 SMES 원본 기준으로 파이프라인을 실행하면 SQLite `line_day` 테이블 값이 `tests/test_analysis.py`의 검증값(1라인 90.16% 등)과 일치한다.

---

## M2. 디자인 시스템 연동

**목표**: 화면을 만들기 전에 공통 레이아웃에 세방 CI가 실제로 적용된 상태를 먼저 만든다.

- `sebang_design_system_2/sebang-design-system/sebang.css`를 `webapp/`으로 복사(또는 참조)하고 `app/layout.tsx`에서 글로벌 import
- `tailwind.config.ts`에 `design.md` 2.5절 시맨틱 토큰을 `var(--color-*)` 참조로 매핑
- 로고 SVG(`design.md` 1.2절)를 컴포넌트화(`components/SebangLogo.tsx`)
- 공통 네비게이션(①/③/④/⑤ 탭), 기간·라인 전역 필터 UI, 다크모드 토글(`data-theme`) 뼈대 작성
- `react-plotly.js` 설치 및 최소 예제 차트 1개로 렌더링 확인

**완료 기준(DoD)**: 빈 페이지에 세방 CI 색상/폰트/로고가 적용된 공통 헤더·네비게이션이 라이트/다크 모드 모두에서 정상 표시된다.

---

## M3. 화면 ① 현황판 (Andon)

**목표**: PRD 4.1절 그대로, 실데이터 기반 첫 화면 완성.

- KPI 카드 4종 쿼리(집계 SQL) 작성: 종합 가동율, 6대부동 합계, 최저 라인, 목표 미달 일수
- 라인별 카드 4개: Plotly `indicator`(gauge) 링 게이지, 상태 배지(정상/주의/경고), 스파크라인, 부동 TOP3 막대
- 목표율(`TARGET_RATE`) 설정 가능한 UI 요소 (FR-8)
- 기간(월) 선택 시 전체 화면 갱신 확인

**완료 기준(DoD)**: 7월 데이터로 렌더링한 결과가 기존 목업(`output/mockups/p1.html`)과 수치가 일치한다.

---

## M4. 화면 ③④⑤ (히트맵 / 로스 / 추이)

**목표**: PRD 4.2~4.4절 3개 화면 완성.

- ③ 히트맵: 라인×일 격자(Plotly `heatmap`) + 부동유형×라인 보조 히트맵 + **셀 클릭 드릴다운**(해당 라인·일자 부동 상세 목록, FR-10)
- ④ 로스: 100% 누적 막대 + 워터폴(Plotly `waterfall`) + 파레토(TOP N 조정 가능, FR-11)
- ⑤ 추이: 라인별 소형 다중 차트(2×2), 7일 이동평균, 목표선, 미달일 표시, 다중 월 이어보기(FR-12)
- 공통 라인 필터(전체/개별, FR-13) 전 화면 적용
- 내보내기(PNG/CSV, FR-14) 버튼 추가

**완료 기준(DoD)**: 4개 화면 모두 실데이터로 렌더링되고, 히트맵 셀 클릭 시 상세 목록이 뜨며, 내보내기가 동작한다.

---

## M5. 업로드/에러 처리 UX

**목표**: 비개발자가 매월 파일 2개만 올리면 끝나는 흐름 완성(PRD 5.1절 FR-1~5).

- `/upload` 페이지: 파일 2종 업로드 폼(Server Action)
- 업로드 즉시 SheetJS로 1차 형식 검증(필수 컬럼 존재 여부) 후 Python 파이프라인 트리거
- 처리 상태 화면(processing/done/error) 및 에러 메시지 노출
- 이미 처리된 월 재업로드 시 덮어쓰기 확인 다이얼로그(FR-3)
- 여러 달 누적 + 기간 선택 조회 지원(FR-4)

**완료 기준(DoD)**: SMES 원본 2개를 업로드하면 별도 코드 수정 없이 대시보드가 자동 갱신된다.

---

## M6. 테스트 · 품질

- Vitest: `lib/ingest.ts`, 집계 쿼리 함수 단위 테스트
- Playwright: 화면 4종 스모크 테스트(페이지 로드 + 필터 변경 후 렌더 확인)
- 기존 `pytest`가 여전히 통과하는지 재확인(계산 로직 변경 없음 검증)

**완료 기준(DoD)**: `npm test`(Vitest+Playwright), `pytest` 모두 통과.

---

## M7. 배포

- 사내망 서버에 Node.js 22 LTS 설치, PM2로 `npm run build && pm2 start`
- SQLite 파일 정기 백업 설정(파일 복사 스케줄)
- 접근 제한(사내망 IP 대역) 설정
- 실제 담당자 대상 사용 안내(README 업데이트 또는 별도 사용 가이드)

**완료 기준(DoD)**: 사내망에서 URL로 접속해 최신 월 데이터를 확인할 수 있고, 재부팅 후에도 PM2가 자동 기동한다.

---

## 2. 열린 질문 (PRD와 동일, 해결되면 이 계획서도 갱신)

1. 배포 서버 위치(로컬 PC vs 사내 서버)
2. 다중 사용자 접근 범위와 최소 접근 제어 방식
3. 목표 가동율(90%) 공식 확정 시점, 라인별 상이 여부
4. 기존 엑셀 보고서(`scripts/excel/`) 병행 여부
