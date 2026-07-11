const { test, expect } = require('@playwright/test');

async function waitAccount(page){
  await page.waitForFunction(() => ['true','local'].includes(document.documentElement.dataset.p2uAccountReady) && Boolean(window.P2UAccounts?.isReady?.()), null, {timeout:15000});
}

test('account center is mobile safe and works in local preview mode', async ({ page }) => {
  await page.setViewportSize({width:344,height:882});
  await page.goto('/account.html',{waitUntil:'domcontentloaded'});
  await waitAccount(page);
  await expect(page.locator('#p2u-account-page-root')).toBeVisible();
  await expect(page.locator('[data-account-email]')).toBeVisible();
  const snapshot=await page.evaluate(()=>window.P2UAccounts.getLocalSnapshot());
  expect(snapshot).toHaveProperty('preferences');
  expect(snapshot).toHaveProperty('alert_settings');
  expect(snapshot).toHaveProperty('draft_slip');
  const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
  expect(overflow).toBeLessThanOrEqual(3);
});

test('global account launcher is available and user chip routes to account center', async ({ page }) => {
  await page.goto('/board.html',{waitUntil:'domcontentloaded'});
  await waitAccount(page);
  await expect(page.locator('#user-chip')).toHaveAttribute('href','account.html');
  await page.goto('/community.html',{waitUntil:'domcontentloaded'});
  await waitAccount(page);
  await expect(page.locator('#p2u-account-launcher')).toBeVisible();
});

test('local follow state is preserved before sign in', async ({ page }) => {
  await page.goto('/account.html',{waitUntil:'domcontentloaded'});
  await waitAccount(page);
  await page.evaluate(async()=>{await window.P2UAccounts.setFollow({handle:'TestMember'},true)});
  const follows=await page.evaluate(()=>window.P2UAccounts.getFollows());
  expect(follows.some(x=>x.target_key==='handle:TestMember')).toBeTruthy();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('p2u-local-follows-v180')||'[]'));
  expect(stored).toContain('handle:TestMember');
});
