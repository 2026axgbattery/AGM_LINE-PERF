import { expect, test } from "@playwright/test";

test("가동율 추이 — 로드 + 기간별 모드로 전환 후 재렌더", async ({ page }) => {
  await page.goto("/trend");
  await expect(page.getByRole("heading", { name: "가동율 추이" })).toBeVisible();
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible();

  await page.getByRole("link", { name: "기간별" }).click();
  await expect(page).toHaveURL(/mode=range/);
  await expect(page.locator('input[name="from"]')).toBeVisible();

  await page.getByRole("button", { name: "적용" }).click();
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible();
});
