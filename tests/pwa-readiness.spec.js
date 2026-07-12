const {test,expect}=require('@playwright/test');

test('manifest exposes launch-candidate install metadata',async({request})=>{
  const res=await request.get('/manifest.webmanifest');
  expect(res.ok()).toBeTruthy();
  const manifest=await res.json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(4);
  expect(manifest.share_target.action).toContain('share.html');
  expect(manifest.icons.some(icon=>String(icon.purpose||'').includes('maskable'))).toBeTruthy();
});

test('public page mounts v200 app controller without horizontal overflow',async({page})=>{
  await page.goto('/index.html',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.p2uPwaReady)).toBe('true');
  const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
  expect(overflow).toBeLessThanOrEqual(3);
});

test('offline route is a useful app shell',async({page})=>{
  await page.goto('/offline.html',{waitUntil:'domcontentloaded'});
  await expect(page.getByRole('heading',{name:'You are offline.'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Today’s Board'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Football News'})).toBeVisible();
});

test('admin app-readiness module mounts',async({page})=>{
  await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-admin-tab="app-readiness"]')).toHaveCount(1);
  await expect(page.locator('[data-admin-panel="app-readiness"]')).toHaveCount(1);
});
