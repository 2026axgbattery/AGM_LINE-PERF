import { expect, test } from "@playwright/test";

test("⑤ 추이 — 로드 + 전체 기간 필터 변경 후 재렌더", async ({ page }) => {
  await page.goto("/trend");
  await expect(page.getByRole("heading", { name: "⑤ 추이" })).toBeVisible();
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible();

  await page.locator('select[name="month"]').selectOption("all");
  await page.getByRole("button", { name: "적용" }).click();

  await expect(page).toHaveURL(/month=all/);
  await expect(page.getByText("전체 기간", { exact: false }).first()).toBeVisible();
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible();
});
