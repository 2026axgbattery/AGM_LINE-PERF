# TO-DO_agm-oee.md — 진행 체크리스트

- 관련 문서: [PLAN_agm-oee.md](PLAN_agm-oee.md), [PRD_agm-oee.md](PRD_agm-oee.md), [TECH_agm-oee.md](TECH_agm-oee.md)
- 이 파일은 대화가 진행되면서 항목이 완료될 때마다 자동으로 `[x]`로 갱신됩니다. 사람이 직접 체크할 필요는 없습니다.
- 마지막 갱신: 2026-09-25 (M1~M5 완료, M6 시작 예정)

## M0. 프로젝트 뼈대
- [x] git 저장소 초기화 + 최초 커밋 (기존 Python 파이프라인 + 문서 스냅샷)
- [x] Node.js 설치 확인 (v24.20.0 — 설치된 버전 그대로 사용하기로 결정, LTS 22 아님)
- [x] `webapp/`에 Next.js(App Router, TypeScript, Tailwind, src/ 디렉터리) 프로젝트 생성 — Next.js 16.3.6
- [x] `better-sqlite3`, `drizzle-orm`, `drizzle-kit` 설치
- [x] `db/schema.ts` 초안 작성 (uploads, line_day, allocation)
- [x] 첫 drizzle 마이그레이션 실행 → `data/agm_oee.sqlite` 생성 확인 (테이블 3개 확인 완료)
- [x] 빈 레이아웃/페이지로 `npm run dev` 구동 확인 (HTTP 200, Turbopack)

## M1. 데이터 적재 파이프라인
- [x] `lib/runPython.ts` 작성 (child_process로 `scripts/export_data.py` 실행) — 에러 처리까지 동작 확인
- [x] `lib/ingest.ts` 작성 (CSV → SQLite upsert, 재계산 없음) — import/트랜잭션 배선 확인
- [x] Python venv pandas 버전을 3.x→2.x로 고정 (회귀 검증 기준과 불일치 위험 방지)
- [x] `uploads` 상태(processing/done/error) 기록 로직 — `lib/uploadPipeline.ts`, status='error' 기록까지 실제 확인
- [x] 7월 데이터로 수동 1회 실행 검증 — 사용자가 실제 SMES 원본 2종을 `data/raw/`에 등록, `npm run ingest:once`로 전체 파이프라인 통과 확인
- [x] 분류 경고("부동>계획" 등) 처리 방식 반영 (PRD FR-5) — `line_day.warning` 컬럼 + `IngestResult.warnings`로 노출 (7월 데이터엔 경고 없음)
- [x] SQLite 적재값이 `tests/test_analysis.py` 검증값과 일치 확인 — 1라인 0.9016, 2라인 0.9143, 3라인 0.8999, 4라인 0.8854, 6대부동합계 16319.0, 수동작업 제외분 8650.0 전부 정확히 일치
- [x] (버그 수정) `export_data.py`가 utf-8-sig(BOM)로 CSV를 쓰는데 `csv-parse`가 BOM을 안 벗겨 첫 컬럼("라인")이 전부 undefined였음 — `parse(..., { bom: true })` + `str()` 가드 추가로 수정

## M2. 디자인 시스템 연동
- [x] `sebang.css`를 `webapp/`에 연결 — `public/design/`에 복사(`npm run sync:design`) 후 `layout.tsx`에서 `<link>`로 로드 (Turbopack이 webapp/ 밖 경로 CSS @import를 막아 이 방식 채택)
- [x] Tailwind v4 `@theme inline`으로 `design.md` 시맨틱 토큰 매핑 (색상·라운드·타입 스케일, `tailwind.config.ts` 대신 CSS 기반)
- [x] 로고 SVG 컴포넌트화 (`components/SebangLogo.tsx`)
- [x] 공통 네비게이션 — 탭 대신 **좌측 사이드바**로 결정(향후 화면 증가 대비, 사용자 확인 완료). `lib/nav.ts` 그룹 배열만 늘리면 새 화면군 추가되는 구조
- [ ] 전역 필터(기간/라인) 뼈대 — M3에서 실제 화면과 함께 설계 예정(보류)
- [x] 다크모드 토글(`data-theme`) 동작 확인 — CSS만으로 전환(React state 없이 hydration mismatch 회피), 스크린샷으로 라이트/다크/토글 클릭까지 확인
- [x] `react-plotly.js` 설치 및 최소 예제 차트 렌더 확인 — `GaugeCard`로 인디케이터 게이지 렌더(더미 데이터), 프로덕션 빌드까지 통과

## M3. 화면 ① 현황판 (Andon)
- [x] KPI 카드 4종 집계 쿼리 작성 (`lib/queries.ts`: `getKpiSummary`, `getLineMonthStats`, `getAvailableMonths`)
- [x] 라인별 카드 4개 (게이지 `Gauge`, 상태 배지, 스파크라인 `Sparkline`, 부동 TOP3 `TopLossBars`) — `LineStatusCard`로 조합
- [x] 목표율 조정 UI (FR-8) — `FilterBar`(순수 GET 폼, JS 없이 새로고침으로 반영), `?target=` 쿼리파라미터로 재계산 확인(90→85%)
- [x] 월 선택 시 전체 갱신 확인 — `?month=` 쿼리파라미터, `getAvailableMonths()`로 select 채움(지금은 7월 1개)
- [x] 기존 목업 수치와 일치 검증 — 종합 90.0%, 6대부동 16,319분, 최저 4라인 88.5%, 목표미달 44/124, 4라인 설비부동 1,708분까지 실제 렌더 결과로 확인

## M4. 화면 ③④⑤
- [x] ③ 히트맵: 라인×일 격자(`HeatmapChart`) + 부동유형×라인 보조 히트맵(`CategoryHeatmap`) — 색상은 named colorscale('RdYlGn'/'Blues')이 기대와 반대로 렌더돼 직접 색상 스톱을 지정해 수정
- [x] ③ 히트맵 셀 클릭 드릴다운 (FR-10) — `/api/day-detail` 라우트 핸들러 + 클릭 시 부동 상세 표(부동유형/부동내역/세부내역/배분분/반영구분) 렌더, 실데이터로 확인
- [x] ④ 로스: 100% 누적 막대(`LossCompositionBar`) + 워터폴(`WaterfallChart`) + 파레토(`ParetoChart`, TOP N `?topn=` 조정 가능, FR-11) — 163,680분/16,319분 등 기존 검증값과 일치
- [x] ⑤ 추이: 라인별 소형 다중 차트(`TrendChart`), 7일 이동평균, 목표선, 미달일 마커, "전체 기간" 옵션(FR-12, 현재는 7월 1개월만 있어 다중 월 이어보기는 데이터 생기면 재검증 필요)
- [x] 라인 필터 적용 (FR-13) — ③④⑤ 공통 `FilterBar`의 라인 select(`?line=`), 전체/1~4라인
- [x] 내보내기 기능 (FR-14) — CSV는 `/api/export/line-day`, `/api/export/allocation` 라우트(`ExportLinks`), PNG는 Plotly 차트 툴바의 기본 카메라 아이콘으로 대체(별도 구현 불필요)

## M5. 업로드/에러 처리 UX
- [x] `/upload` 페이지 (파일 2종 업로드 Server Action, `useActionState`) — 실제 8월 원본으로 브라우저 업로드까지 확인
- [x] SheetJS(xlsx) 1차 형식 검증 — 필수 컬럼 확인 + `일자별` 컬럼에서 연/월 자동 인식(FR-2). **npm의 `xlsx` 패키지는 패치 안 된 고위험 취약점(프로토타입 오염·ReDoS)이 있어 SheetJS 공식 CDN 빌드(`cdn.sheetjs.com`)로 대체**
- [x] 처리 상태(processing/done/error) 화면 노출 — 업로드 폼 결과 메시지 + "최근 업로드" 이력 표(`getUploadHistory`)
- [x] 재업로드 시 덮어쓰기 확인 (FR-3) — `needs-confirm` 상태로 1차 저지, 파일 재선택 후 확인 버튼으로 진행. 실제로 8월을 두 번 업로드해 덮어쓰기(중복 없이 124행 유지)까지 확인
- [x] 다중 월 누적 + 기간 선택 조회 (FR-4) — **`analysis.run_all()`/`export_data.py`를 연/월·경로 인자를 받도록 확장**(기본값은 기존과 동일, pytest 5종 재확인). 실제로 7월+8월이 DB에 함께 쌓였고 ⑤추이 "전체 기간"이 7→8월 경계를 이어서 보여주는 것까지 확인
- [x] (부수 발견) `/upload` 페이지가 DB를 읽는데도 정적 페이지로 빌드돼 업로드 후 이력이 갱신 안 될 위험 → `export const dynamic = "force-dynamic"`으로 고정

## M6. 테스트 · 품질
- [ ] Vitest: `lib/ingest.ts` 및 집계 쿼리 단위 테스트
- [ ] Playwright: 화면 4종 스모크 테스트
- [ ] 기존 `pytest` 통과 재확인 (계산 로직 무변경 검증)

## M7. 배포
- [ ] 사내망 서버 Node.js 22 LTS 설치
- [ ] PM2로 빌드/기동 (`npm run build && pm2 start`)
- [ ] SQLite 파일 정기 백업 설정
- [ ] 사내망 접근 제한 설정
- [ ] 사용 안내 문서/README 갱신

## 열린 질문 (해결되는 대로 갱신)
- [ ] 배포 서버 위치 확정
- [ ] 다중 사용자 접근 범위·접근 제어 방식 확정
- [ ] 목표 가동율(90%) 공식 확정 및 라인별 상이 여부
- [ ] 기존 엑셀 보고서(`scripts/excel/`) 병행 여부 확정
