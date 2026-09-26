import { expect, test } from "@playwright/test";

test("③ 히트맵 — 로드 + 라인 필터 변경 후 재렌더", async ({ page }) => {
  await page.goto("/heatmap");
  await expect(page.getByRole("heading", { name: "③ 히트맵" })).toBeVisible();
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible();

  await page.locator('select[name="line"]').selectOption("AGM조립1라인");
  await page.getByRole("button", { name: "적용" }).click();

  await expect(page).toHaveURL(/line=AGM/);
  await expect(page.getByRole("heading", { name: "③ 히트맵" })).toBeVisible();
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible();
});
