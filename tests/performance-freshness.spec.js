const { test, expect } = require('@playwright/test');

test('quiet freshness indicator replaces intrusive alerts', async ({ page }) => {
  await page.goto('/board.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#p2u-freshness-line')).toBeVisible();
  await expect(page.locator('.p2u-system-alert')).toHaveCount(0);
  await expect(page.getByText('Core match data is more than 36 hours old')).toHaveCount(0);
});

test('loading state resolves and board remains usable', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  expect(await page.locator('html').evaluate(el => el.classList.contains('p2u-booting'))).toBe(false);
  await expect(page.locator('#cards')).toBeAttached();
  await expect(page.locator('#f-search')).toBeEnabled();
});

test('performance resource hints are present', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  for (const host of ['cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net']) {
    expect(await page.locator(`link[rel="preconnect"][href*="${host}"]`).count()).toBeGreaterThan(0);
  }
});

test('freshness layer is responsive on Z Fold cover', async ({ page }) => {
  await page.setViewportSize({ width: 344, height: 882 });
  await page.goto('/board.html', { waitUntil: 'domcontentloaded' });
  const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
  expect(overflow).toBeLessThanOrEqual(3);
  await expect(page.locator('#p2u-freshness-line')).toBeVisible();
});
