import { createBackup } from "@/lib/admin";

// 관리자 모드 "DB 백업 다운로드" 버튼이 호출하는 라우트. 인증 게이트는 없다(사내망 배포,
// 설정 화면의 5클릭 잠금해제와 동급의 낮은 보안 수준으로 의도됨).
export async function GET() {
  const { filename, data } = await createBackup();
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
