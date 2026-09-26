import path from "node:path";
import { defineConfig } from "vitest/config";

const TEST_ROOT = path.resolve(import.meta.dirname, ".vitest-scratch");

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    // tests/e2e/는 @playwright/test 전용이라 Vitest가 같이 주워가면 안 된다.
    include: ["src/**/*.test.ts"],
    globalSetup: "./vitest.global-setup.mts",
    // 모든 테스트 파일이 같은 SQLite 파일(WAL)을 공유한다 — 동시에 여러 워커가 열면
    // "database is locked"가 나서 파일 단위 병렬 실행을 끈다(테스트 수가 적어 비용 작음).
    fileParallelism: false,
    env: {
      // lib/paths.ts가 이 값을 프로젝트 루트로 삼는다 — 테스트가 실제 output/.venv를
      // 건드리지 않도록 스크래치 디렉터리로 격리한다 (ingest.ts 테스트는 Python을 부르지 않음).
      AGM_OEE_PROJECT_ROOT: TEST_ROOT,
      AGM_OEE_DB_PATH: path.join(TEST_ROOT, "test.sqlite"),
    },
  },
});
