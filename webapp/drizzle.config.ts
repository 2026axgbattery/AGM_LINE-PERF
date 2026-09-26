import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // 테스트(Vitest)가 별도 SQLite 파일에 마이그레이션을 걸 때 이 값으로 override한다.
    url: process.env.AGM_OEE_DB_PATH ?? "./data/agm_oee.sqlite",
  },
});
