const { test, expect } = require("@playwright/test");
async function waitReady(page, datasetKey, fallback) {
  await page.waitForFunction(({ datasetKey, fallback }) => {
    return document.documentElement.dataset[datasetKey] === 'true' || (fallback && Boolean(window[fallback]));
  }, { datasetKey, fallback }, { timeout: 30000 });
}

test("growth sharing loads and decorates match cards", async ({ page }) => {
  await page.goto("/index.html");
  await waitReady(page, 'p2uGrowthReady', 'P2UGrowthSharing');
  await expect(page.locator("link[href=\"growth-sharing.css\"]")).toHaveCount(1);
  const cards=page.locator('[data-p2u-match-key]');
  if(await cards.count()){ await page.evaluate(()=>window.P2UGrowthSharing.decorate(document)); await expect(cards.first().locator('.p2u-share-card-btn')).toBeVisible({timeout:15000}); }
});
test("share landing page is mobile safe", async ({ page }) => {
  await page.setViewportSize({width:344,height:882});
  await page.goto("/share.html?type=engine&name=Prime");
  await expect(page.locator("#share-title")).toHaveText("Prime");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  expect(overflow).toBeFalsy();
});
