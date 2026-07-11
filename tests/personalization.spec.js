const { test, expect } = require('@playwright/test');

async function cleanPersonalization(page) {
  await page.addInitScript(() => {
    localStorage.removeItem('p2u-personalization-v167');
    localStorage.setItem('p2u-onboarding-v157', '1');
  });
}

test('personalization controls are usable and persist on mobile', async ({ page }) => {
  await cleanPersonalization(page);
  await page.setViewportSize({ width: 344, height: 882 });
  await page.goto('/board.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(350);

  await expect(page.locator('#p2u-personalization-bar')).toBeVisible();
  await page.locator('[data-p2u-open]').click();
  await expect(page.locator('#p2u-personalization-panel')).toBeVisible();

  const engineChoices = page.locator('[data-p2u-fav-engine]');
  expect(await engineChoices.count()).toBe(16);
  await engineChoices.first().click();
  await expect(engineChoices.first()).toHaveAttribute('aria-pressed', 'true');

  await page.locator('[data-p2u-close]').first().click();
  await page.locator('[data-p2u-scope]').click();
  await expect(page.locator('[data-p2u-scope]')).toHaveAttribute('aria-pressed', 'true');

  await page.locator('[data-p2u-view="compact"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-p2u-card-view', 'compact');

  const search = page.locator('#f-search');
  await search.fill('united');
  await page.waitForTimeout(100);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);

  await expect(page.locator('body')).toHaveAttribute('data-p2u-card-view', 'compact');
  await expect(page.locator('[data-p2u-scope]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#f-search')).toHaveValue('united');

  const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
  expect(overflow).toBeLessThanOrEqual(3);
});

test('league favorites, hidden leagues and recent history are available', async ({ page }) => {
  await cleanPersonalization(page);
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(350);
  await page.locator('[data-p2u-open]').click();

  const leagueRows = page.locator('.p2u-league-row');
  if (await leagueRows.count()) {
    const first = leagueRows.first();
    await first.locator('[data-p2u-fav-league]').click();
    await expect(first.locator('[data-p2u-fav-league]')).toHaveAttribute('aria-pressed', 'true');
    await first.locator('[data-p2u-hide-league]').click();
    await expect(first.locator('[data-p2u-hide-league]')).toHaveAttribute('aria-pressed', 'true');
  }

  await page.locator('[data-p2u-close]').first().click();
  const details = page.locator('#cards .btn-det').first();
  if (await details.count()) {
    await details.click();
    await page.locator('[data-p2u-open]').click();
    await expect(page.locator('.p2u-recent-item').first()).toBeVisible();
  }
});
