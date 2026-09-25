# TECH_agm-oee.md — 기술 스택

- 문서 버전: v1.0
- 작성일: 2026-09-25
- 관련 문서: [PRD_agm-oee.md](PRD_agm-oee.md), [CLAUDE.md](CLAUDE.md), [design.md](design.md)
- 전제 조건(사용자 지정): **Node.js + SQLite**. 그 외 구성 요소는 이 전제에 맞춰 최적 조합으로 선정.

## 1. 설계 원칙

### 1.1 계산 엔진과 웹 서비스 계층을 분리한다
`src/agm/analysis.py`는 2026년 7월 회귀 테스트(`tests/test_analysis.py`)까지 통과한 **검증된 단일 계산 로직**이다. CLAUDE.md에 이미 "분류 규칙이 `analysis.py`와 `scripts/excel/build_base.py`에 중복되어 있어 통합 대상"이라고 기술 부채가 지적되어 있는데, 여기서 다시 같은 로직을 Node.js/TypeScript로 재작성하면 **세 번째 중복본**이 생기고 세 곳의 규칙이 어긋날 위험이 커진다.

그래서 이번 웹앱은:
- **계산(분류·배분·가동율 산출)은 계속 Python(`analysis.py`)이 담당**한다. 새 기능/기준 변경도 여전히 그쪽에 추가한다(CLAUDE.md 규칙 그대로 유지).
- **Node.js는 그 결과를 저장(SQLite)하고, 조회·시각화하는 웹 서비스 계층만 담당**한다.
- 두 계층은 파일(CSV/JSON) 또는 자식 프로세스 호출로만 연결한다(아래 5장).

이 분리 덕분에 "Node.js 기반 웹앱"이라는 전제를 지키면서도, 이미 검증된 산식을 다시 검증할 필요가 없다.

### 1.2 규모에 맞춘 단순함
사용자(현장 관리자 수 명, 월 1회 파일 업로드, 사내망 내부)를 기준으로 과설계를 피한다. 큐/캐시 서버(Redis), 별도 API 게이트웨이, 마이크로서비스 분리 같은 요소는 이번 규모에 불필요하므로 채택하지 않는다.

---

## 2. 스택 요약

| 영역 | 선택 | 대안(검토했지만 제외) |
|---|---|---|
| 런타임 | **Node.js 22 LTS** (TypeScript) | — (사용자 전제) |
| 풀스택 프레임워크 | **Next.js 15 (App Router)** | Express+React(SPA) — API/프론트 저장소·배포가 둘로 나뉘어 이 규모엔 과함 |
| 데이터베이스 | **SQLite** (전제) | — |
| DB 드라이버 | **better-sqlite3** | node:sqlite(실험적, LTS 안정성 부족), sql.js(브라우저용) |
| ORM/쿼리 빌더 | **Drizzle ORM** + drizzle-kit(마이그레이션) | Prisma — SQLite 동시쓰기·마이그레이션 유연성이 Drizzle보다 떨어짐 |
| 서버 로직 | **Next.js Server Actions**(쓰기) + **Server Components**(읽기, DB 직접 조회) | 별도 REST API, tRPC — 단일 Next.js 앱 안에서는 한 겹 더할 이유가 없음 |
| 계산 엔진 연동 | **Python 자식 프로세스 호출**(`child_process.execFile`) | 로직을 TS로 포팅 — 1.1절 사유로 제외 |
| 차트 | **Plotly.js**(react-plotly.js) | Recharts/visx — 히트맵·워터폴·게이지(gauge indicator)를 기본 제공하지 않아 4종 화면에 라이브러리가 갈라짐 |
| 스타일 | **Tailwind CSS** + 기존 `sebang.css` 토큰 | CSS Modules — 토큰 연동·생산성에서 Tailwind가 유리 |
| 폼/입력 검증 | **Zod** | — |
| 데이터 페칭(클라이언트) | **TanStack Query**(차트 상호작용용 부분적으로만) | — |
| 파일 업로드 파싱(2차 검증) | **xlsx(SheetJS)**(업로드 즉시 형식 확인용, 실제 계산은 Python) | — |
| 테스트(Node) | **Vitest**(단위) + **Playwright**(e2e) | Jest — Vite/Next 생태계와 궁합이 더 좋은 Vitest 선택 |
| 테스트(Python) | 기존 **pytest** 유지 | — |
| 패키지 매니저 | **npm**(기존 `package-lock.json` 유지) | pnpm — 신규 채택 비용 대비 이점이 적어 기존 도구 유지 |
| 프로세스 관리 | **PM2** | Docker — 사내망 단일 서버 배포엔 PM2로 충분, 운영 복잡도 최소화 |

---

## 3. 백엔드 / 풀스택 프레임워크 — Next.js (App Router)

- Node.js 위에서 동작하는 **단일 애플리케이션**으로 프론트엔드(대시보드 화면)와 백엔드(업로드 처리, DB 조회)를 함께 배포한다. 저장소·빌드·배포가 하나로 통일되어 내부 도구 규모에 적합하다.
- **읽기**: 각 화면(①현황판 ③히트맵 ④로스 ⑤추이)의 Server Component에서 Drizzle로 SQLite를 직접 쿼리해 서버에서 렌더링한다. 별도 API 왕복이 없어 빠르고 코드가 단순해진다.
- **쓰기**(파일 업로드, 재계산 트리거)는 Next.js **Server Action**으로 처리한다. 클라이언트는 `<form action={uploadAction}>` 형태로 호출하고, 서버에서 파일 저장 → Python 실행 → SQLite 적재까지 한 함수 안에서 순서대로 수행한다.
- 차트처럼 상호작용(히트맵 셀 클릭 드릴다운, 필터 변경)이 필요한 부분만 Client Component + TanStack Query로 필요한 조각만 다시 불러온다.

---

## 4. 데이터베이스 — SQLite

### 4.1 왜 이 규모에 SQLite가 최적인가
- 업로드는 월 1회, 조회자는 사내 소수 인원 — 별도 DB 서버 운영 비용이 정당화되지 않는다.
- 파일 하나(`data/agm_oee.sqlite`)로 백업·이관이 끝난다(복사만 하면 됨).
- `better-sqlite3`는 동기 API라 Server Action/Server Component 안에서 async 오버헤드 없이 바로 쓸 수 있다.

### 4.2 스키마 초안 (Drizzle)
```ts
// db/schema.ts
export const uploads = sqliteTable('uploads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  summaryFile: text('summary_file').notNull(),
  detailFile: text('detail_file').notNull(),
  uploadedAt: text('uploaded_at').notNull(),
  status: text('status').notNull(), // 'processing' | 'done' | 'error'
})

export const lineDay = sqliteTable('line_day', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  line: text('line').notNull(),          // 'AGM조립1라인' 등
  date: text('date').notNull(),          // ISO date
  productionLoss: real('production_loss').notNull(),
  equipmentLoss: real('equipment_loss').notNull(),
  materialLoss: real('material_loss').notNull(),
  managementLoss: real('management_loss').notNull(),
  lineImbalanceLoss: real('line_imbalance_loss').notNull(),
  materialChangeLoss: real('material_change_loss').notNull(),
  sixLossTotal: real('six_loss_total').notNull(),
  planMinutes: real('plan_minutes').notNull(),
  operatingMinutes: real('operating_minutes').notNull(),
  operatingRate: real('operating_rate').notNull(),
})

export const allocation = sqliteTable('allocation', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  line: text('line').notNull(),
  lossCategory: text('loss_category').notNull(),   // 부동유형
  detail: text('detail').notNull(),                // 부동내역
  minutesAllocated: real('minutes_allocated').notNull(),
  isManualExcluded: integer('is_manual_excluded', { mode: 'boolean' }).notNull(),
})
```
- `line_day`, `allocation`은 `output/agm_line_day.csv`, `output/agm_allocation.csv`(기존 `export_data.py` 산출물)를 그대로 적재하는 테이블이다. **컬럼 정의를 새로 만들지 않고 기존 CSV 스키마를 따른다.**
- `monthly` 합계·파레토 TOP N은 저장하지 않고 `line_day`/`allocation`에서 SQL로 그때그때 집계한다(중복 저장으로 인한 불일치를 피함).
- 월 단위 조회 성능을 위해 `line_day(line, date)`, `allocation(date, line)`에 인덱스를 둔다.

---

## 5. 계산 엔진 연동 흐름

```
[사용자] SMES 원본 2종 업로드
      │  (Server Action)
      ▼
Node.js: data/raw/에 저장, uploads 테이블에 status='processing' 기록
      │  child_process.execFile('python', ['scripts/export_data.py', ...])
      ▼
Python: 기존 load_summary/classify/allocate/line_day/monthly 그대로 실행
      │  output/agm_line_day.csv, agm_allocation.csv 생성 (기존과 동일)
      ▼
Node.js: 위 CSV를 csv-parse로 읽어 line_day/allocation 테이블에 upsert
      │  uploads.status='done'으로 갱신
      ▼
대시보드 화면들이 SQLite를 조회해 렌더링
```

- Python 실행에는 프로젝트에 이미 있는 `.venv`를 그대로 쓴다(가상환경 경로를 설정값으로 관리).
- 처리 중 실패(분류 실패, 검증 경고 등)는 `uploads.status='error'`와 함께 Python stderr를 저장해 업로드 화면에 노출한다(PRD FR-5).
- CSV → SQLite 적재 스크립트는 Node.js 쪽 코드(`lib/ingest.ts`)로 작성하며, **가동율 재계산은 하지 않고 Python 결과를 그대로 옮겨 담기만 한다**(로직 이중화 방지).

---

## 6. 프론트엔드

### 6.1 화면 구조
Next.js App Router 라우트로 PRD의 화면 4개 + 업로드 화면을 구성한다.
```
app/
├─ page.tsx              # ① 현황판 (기본 진입)
├─ heatmap/page.tsx       # ③ 히트맵
├─ loss/page.tsx          # ④ 로스 워터폴/파레토
├─ trend/page.tsx         # ⑤ 추이
├─ upload/page.tsx        # SMES 원본 업로드
└─ layout.tsx             # 공통 네비게이션, 기간/라인 필터
```

### 6.2 차트 — Plotly.js 단일 채택
| 화면 | Plotly 차트 타입 |
|---|---|
| ① 링 게이지 | `indicator` (mode: gauge+number) |
| ① 스파크라인 | `scatter`(mini, 축 숨김) |
| ③ 히트맵 | `heatmap` |
| ④ 워터폴 | `waterfall` |
| ④ 파레토 | `bar` + 보조축 `scatter`(누적선) |
| ⑤ 추이 | `scatter`(일별 실선 + 7일 이동평균 + 목표선 `shape`) |

하나의 라이브러리로 4개 화면의 모든 차트 타입(게이지·히트맵·워터폴 포함)을 표준 지원하므로 라이브러리를 나눌 필요가 없다. `react-plotly.js`로 React에 바로 연결한다.

### 6.3 스타일 연동
- `app/layout.tsx`에서 `sebang_design_system_2/sebang-design-system/sebang.css`를 글로벌 import한다.
- `tailwind.config.ts`의 색상 토큰을 새로 정의하지 않고 `sebang.css`의 CSS 변수(`var(--color-accent-primary)` 등)를 그대로 참조하도록 매핑한다. 색상값을 두 곳에 따로 적지 않는다(`design.md`가 유일한 근거 문서로 유지됨).
- 다크모드는 `<html data-theme="dark">` 토글 + Tailwind `dark:` 변형을 함께 사용한다.

---

## 7. 검증·테스트

- **Zod**: 업로드 Server Action의 입력(파일 종류, 연/월 파라미터) 검증.
- **Vitest**: `lib/ingest.ts`(CSV→SQLite 적재), 집계 쿼리 함수 단위 테스트.
- **Playwright**: 화면 4종 스모크 테스트(페이지 로드, 필터 변경 후 차트 렌더 확인). 기존 `scripts/dashboard/screenshot.py`(Python+Playwright)는 정적 목업용으로 계속 남겨두고, 실제 웹앱 검증은 Node 쪽 Playwright로 별도 작성한다.
- **pytest**: 기존 그대로. 산출 로직을 바꾸면 여전히 `pytest`로 먼저 확인한다(CLAUDE.md 규칙 유지).

---

## 8. 실행/배포

```powershell
# 웹앱 최초 설정 (Node.js 22 LTS 설치 후)
cd webapp        # 아래 8.2 폴더 구조 참고
npm install
npm run db:migrate     # drizzle-kit migrate
npm run dev            # 개발 서버

# 운영 배포
npm run build
pm2 start npm --name agm-oee -- start
```

### 8.1 사내망 배포
- 별도 로그인 없이 **사내망 IP 대역 접근 제한**만으로 시작한다(PRD 열린 질문 2 관련 — 필요해지면 Auth.js 같은 라이브러리를 나중에 추가해도 Next.js 구조상 큰 변경이 없다).
- SQLite 파일(`data/agm_oee.sqlite`)은 정기 백업(예: 매일 파일 복사)만으로 충분하다.

### 8.2 폴더 구조 제안
기존 Python 프로젝트 구조를 건드리지 않고, 웹앱은 하위 폴더로 추가한다.
```
agm-oee/
├─ src/agm/               ← 기존 Python 계산 엔진 (그대로 유지)
├─ scripts/                ← 기존 (export_data.py를 웹앱이 호출)
├─ webapp/                 ← 신규 Node.js/Next.js 앱
│   ├─ app/                ← 6.1 화면 라우트
│   ├─ db/schema.ts         ← 4.2 Drizzle 스키마
│   ├─ lib/ingest.ts         ← 5장 CSV→SQLite 적재
│   ├─ lib/runPython.ts      ← 5장 child_process 호출
│   └─ data/agm_oee.sqlite   ← SQLite 파일(.gitignore 대상)
└─ (기존 파일들)
```

---

## 9. 이번 범위에서 제외한 것 (근거)

- **Redis/큐**: 업로드 빈도(월 1회)와 사용자 수를 고려하면 비동기 큐가 필요한 부하가 없다. Server Action 안에서 동기적으로 처리해도 충분하다.
- **tRPC/별도 REST API**: 프론트와 백엔드가 같은 Next.js 프로젝트 안에 있어 API 계약을 별도로 정의할 이유가 없다(Server Actions/Server Components로 대체).
- **Docker**: 사내 단일 서버에 Node.js + PM2로 직접 배포하는 편이 이번 규모에서는 운영 부담이 적다. 서버를 여러 대로 늘리거나 CI/CD 파이프라인이 생기면 그때 컨테이너화를 재검토한다.
- **인증 시스템**: 사내망 접근 제한으로 우선 대체(PRD 열린 질문과 연결, 확정되면 이 문서를 갱신).
