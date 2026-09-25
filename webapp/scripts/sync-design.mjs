// sebang_design_system_2/(원본 디자인 시스템)의 sebang.css를 webapp/public/design/에 복사한다.
// Turbopack이 webapp/ 바깥 파일을 CSS @import 하지 못해 정적 파일로 옮겨 <link>로 로드한다.
// 원본을 고치면 이 스크립트를 다시 실행해야 웹앱에 반영된다 (자동 동기화 아님).
// 사용: npm run sync:design (npm install 시 postinstall로 자동 실행)
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webappRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const projectRoot = dirname(webappRoot);

const src = join(
  projectRoot,
  "sebang_design_system_2",
  "sebang-design-system",
  "sebang.css",
);
const destDir = join(webappRoot, "public", "design");
const dest = join(destDir, "sebang.css");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`✓ ${src}\n  → ${dest}`);
