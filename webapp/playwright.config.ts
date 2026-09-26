import { defineConfig, devices } from "@playwright/test";

// 스모크 테스트 — 실제 개발 DB(webapp/data/agm_oee.sqlite)에 이미 적재된 데이터를 그대로 쓴다.
// 화면 4종(①③④⑤)이 페이지 로드 + 필터 변경 후에도 정상 렌더되는지만 확인한다(PLAN M6).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // 같은 개발 DB(SQLite)를 공유하므로 순차 실행
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
