const { test, expect } = require('@playwright/test');
test('community board progressively reveals long lists', async ({ page }) => {
  await page.setViewportSize({width:360,height:800}); await page.goto('/community.html'); await page.locator('#board').evaluate(host=>{host.innerHTML=Array.from({length:25},(_,i)=>`<div class="pick"><div class="who"><div class="t">Team ${i+1} v Rival ${i+1}</div></div><span class="mk">DC 1X</span></div>`).join('')}); await page.evaluate(()=>window.P2UCommunityConsistency.refresh()); await expect.poll(()=>page.locator('#board > .pick:not([hidden])').count()).toBe(12); await expect(page.locator('#p2u-community-board-more')).toBeVisible(); await page.locator('#p2u-community-board-more').click(); await expect.poll(()=>page.locator('#board > .pick:not([hidden])').count()).toBe(24);
});
test('community uses only the global mobile navigation', async ({ page }) => {
  await page.setViewportSize({width:344,height:882}); await page.goto('/community.html'); await expect(page.locator('.community-mobile-nav')).toHaveCount(0); await expect(page.locator('.p2u-mobile-app-nav')).toHaveCount(1);
});
