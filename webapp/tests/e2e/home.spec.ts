import { expect, test } from "@playwright/test";

test("① 현황판 — 로드 + 목표 가동율 필터 변경 후 재렌더", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "① 현황판" })).toBeVisible();

  // 라인별 게이지 차트(Plotly)가 최소 1개 이상 렌더됐는지
  await expect(page.locator(".js-plotly-plot").first()).toBeVisible();
  await expect(page.getByText("목표 90% 기준")).toBeVisible();

  await page.locator('input[name="target"]').fill("60");
  await page.getByRole("button", { name: "적용" }).click();

  await expect(page).toHaveURL(/target=60/);
  await expect(page.getByRole("heading", { name: "① 현황판" })).toBeVisible();
  // 목표 달성 라인 카드의 힌트 문구가 바뀌었는지로 실제 재계산 여부를 확인한다
  // (가동율 자체는 target과 무관해서, 값이 우연히 같아도 되는 지표 대신 이걸 본다).
  await expect(page.getByText("목표 60% 기준")).toBeVisible();
});
