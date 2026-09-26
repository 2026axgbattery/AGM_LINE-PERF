import { expect, test } from "@playwright/test";

test("① 현황판 — 로드 + 목표 가동율 필터 변경 후 재렌더", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "① 현황판" })).toBeVisible();

  // 라인별 게이지 차트(Plotly)가 최소 1개 이상 렌더됐는지
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible();

  const belowTargetBefore = await page.locator("text=목표 미달 일수").locator("..").innerText();

  await page.locator('input[name="target"]').fill("60");
  await page.getByRole("button", { name: "적용" }).click();

  await expect(page).toHaveURL(/target=60/);
  await expect(page.getByRole("heading", { name: "① 현황판" })).toBeVisible();
  const belowTargetAfter = await page.locator("text=목표 미달 일수").locator("..").innerText();
  // 목표를 60%로 낮추면 미달 일수는 절대 늘어날 수 없다(대개 줄어든다) — 재계산이 실제로 일어났는지 확인
  expect(belowTargetAfter).not.toBe(belowTargetBefore);
});
