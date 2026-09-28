// PM2 프로세스 정의 (M7 배포). `npx pm2 start ecosystem.config.cjs`로 실행한다.
module.exports = {
  apps: [
    {
      name: "agm-oee",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0", // 사내망 다른 PC에서도 접속 가능하도록 모든 인터페이스에서 수신
      },
    },
  ],
};
