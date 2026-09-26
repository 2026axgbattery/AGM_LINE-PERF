import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TEST_ROOT = path.resolve(import.meta.dirname, ".vitest-scratch");
const TEST_DB = path.join(TEST_ROOT, "test.sqlite");

export async function setup() {
  fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  fs.mkdirSync(path.join(TEST_ROOT, "output"), { recursive: true });

  execSync("npx drizzle-kit migrate", {
    cwd: import.meta.dirname,
    env: { ...process.env, AGM_OEE_DB_PATH: TEST_DB },
    stdio: "inherit",
  });
}

export async function teardown() {
  fs.rmSync(TEST_ROOT, { recursive: true, force: true });
}
