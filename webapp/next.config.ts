import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 상위 폴더(agm-oee)의 package-lock.json과 이 폴더의 lockfile이 함께 잡혀
  // 워크스페이스 루트가 잘못 추론되는 것을 막는다 (webapp만 Node.js 앱의 루트).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
