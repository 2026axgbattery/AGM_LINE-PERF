import { NextResponse } from "next/server";
import { getDayDetail } from "@/lib/queries";

// ③히트맵 셀 클릭 드릴다운 (FR-10) — 특정 라인·일자의 부동 상세 목록.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const line = searchParams.get("line");

  if (!date || !line) {
    return NextResponse.json({ error: "date, line 쿼리파라미터가 필요합니다" }, { status: 400 });
  }

  return NextResponse.json(getDayDetail(date, line));
}
