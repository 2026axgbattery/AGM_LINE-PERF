import path from "node:path";

// webapp/ 은 항상 프로젝트 루트(agm-oee/)의 바로 아래 폴더라는 전제 (TECH 8.2절 폴더 구조).
// AGM_OEE_PROJECT_ROOT로 덮어쓸 수 있게 해 배포 환경이 달라져도 대응 가능하게 한다.
export const PROJECT_ROOT =
  process.env.AGM_OEE_PROJECT_ROOT ?? path.resolve(process.cwd(), "..");

export const PYTHON_BIN =
  process.env.PYTHON_BIN ??
  path.join(PROJECT_ROOT, ".venv", "Scripts", "python.exe");

export const OUTPUT_DIR = path.join(PROJECT_ROOT, "output");
export const RAW_DIR = path.join(PROJECT_ROOT, "data", "raw");
export const EXPORT_SCRIPT = path.join(PROJECT_ROOT, "scripts", "export_data.py");
export const BACKUP_DIR = path.join(PROJECT_ROOT, "backups");
