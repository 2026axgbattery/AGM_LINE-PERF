import { describe, expect, it } from "vitest";
import { addDays, daysBetween, previousPeriod, previousRange, previousYear } from "../period";

describe("addDays", () => {
  it("월/년 경계를 넘어도 로컬 날짜로 정확히 계산한다", () => {
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01"); // 2026은 평년
  });
});

describe("daysBetween", () => {
  it("당일을 포함해 센다", () => {
    expect(daysBetween("2026-09-01", "2026-09-01")).toBe(1);
    expect(daysBetween("2026-09-01", "2026-09-26")).toBe(26);
  });
});

describe("previousPeriod", () => {
  it("일 단위는 하루 전, 월 단위는 한 달 전을 반환한다", () => {
    expect(previousPeriod("2026-09-26")).toBe("2026-09-25");
    expect(previousPeriod("2026-01-01")).toBe("2025-12-31");
    expect(previousPeriod("2026-09")).toBe("2026-08");
    expect(previousPeriod("2026-01")).toBe("2025-12");
  });
});

describe("previousRange", () => {
  it("같은 길이의 바로 이전 구간을 반환한다", () => {
    expect(previousRange("2026-09-01", "2026-09-26")).toEqual({ from: "2026-08-06", to: "2026-08-31" });
  });
});

describe("previousYear", () => {
  it("일/월 단위 모두 연도만 1 뺀다 (가동율 비교분석 전년 비교용)", () => {
    expect(previousYear("2026-09-26")).toBe("2025-09-26");
    expect(previousYear("2026-09")).toBe("2025-09");
  });
});
