import { expect, test } from "@playwright/test";

test("6대부동 분석 — 로드 + 파레토 TOP N 변경 후 재렌더", async ({ page }) => {
  await page.goto("/loss");
  await expect(page.getByRole("heading", { name: "6대부동 분석" })).toBeVisible();
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible();

  await page.locator('input[name="topn"]').fill("5");
  await page.getByRole("button", { name: "적용" }).click();

  await expect(page).toHaveURL(/topn=5/);
  await expect(page.getByText("부동 원인 파레토 TOP 5")).toBeVisible();
});
