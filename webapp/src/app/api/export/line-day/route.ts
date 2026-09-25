import { toCsv } from "@/lib/csv";
import { getAvailableMonths, getLineDayRows } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const months = getAvailableMonths();
  const month = searchParams.get("month");
  const selectedMonth = month === "all" || (month && months.includes(month)) ? month! : months[0];
  const line = searchParams.get("line") ?? undefined;

  if (!selectedMonth) {
    return new Response("데이터가 없습니다", { status: 404 });
  }

  const csv = toCsv(getLineDayRows(selectedMonth, line));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="line_day_${selectedMonth}.csv"`,
    },
  });
}
