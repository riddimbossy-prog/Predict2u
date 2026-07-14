const { test, expect } = require('@playwright/test');
test('existing card crests are not duplicated', async ({ page }) => {
  await page.goto('/board.html'); await expect.poll(()=>page.evaluate(()=>Boolean(window.P2UFootballAssets))).toBe(true);
  await page.locator('body').evaluate(() => {window.MATCHES=[{home:'Alpha FC',away:'Beta United',homeLogo:'https://example.com/a.png',awayLogo:'https://example.com/b.png',league:'Test League',country:'Ghana'}];const host=document.createElement('div');host.id='crest-test';host.className='p2u-card-teams';host.innerHTML='<img class="crest-sm" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="> Alpha FC<br><span>vs</span> <img class="crest-sm" src="data:image/gif;base64,R0lGODlhAQABAAAAACw="> Beta United';document.body.append(host);window.P2UFootballAssets.rebuild();window.P2UFootballAssets.decorate();});
  await expect.poll(()=>page.locator('#crest-test .crest-sm').count()).toBe(2); await expect(page.locator('#crest-test .p2u-team-pair-prefix')).toHaveCount(0); await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.p2uCrestMode)).toBe('balanced');
});
test('community dense board remains text first', async ({ page }) => {
  await page.goto('/community.html'); await page.locator('#board').evaluate(host=>{host.innerHTML='<div class="pick"><div class="community-pick-title">Alpha FC v Beta United</div></div>'}); await page.evaluate(()=>{window.MATCHES=[{home:'Alpha FC',away:'Beta United',homeLogo:'a.png',awayLogo:'b.png'}];window.P2UFootballAssets.rebuild();window.P2UFootballAssets.decorate()}); await page.waitForTimeout(150); await expect(page.locator('#board .p2u-team-pair-prefix')).toHaveCount(0);
});
