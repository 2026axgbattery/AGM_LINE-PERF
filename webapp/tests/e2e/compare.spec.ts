import { expect, test } from "@playwright/test";

test("가동율 비교분석 — 로드 + 전월/전년 비교 토글 후 재렌더", async ({ page }) => {
  await page.goto("/compare");
  await expect(page.getByRole("heading", { name: "가동율 비교분석" })).toBeVisible();
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible();

  await page.getByRole("link", { name: "전월 비교" }).click();
  await expect(page).toHaveURL(/mode=month/);
  await expect(page.getByText("라인별 시간가동율 비교")).toBeVisible();

  await page.getByRole("link", { name: "전년 비교" }).click();
  await expect(page).toHaveURL(/mode=year/);
  await expect(page.getByRole("heading", { name: "가동율 비교분석" })).toBeVisible();
});
