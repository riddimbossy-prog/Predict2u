const {test,expect}=require('@playwright/test');

test('community top picks only shows today active fixtures',async({page})=>{
  await page.route('**/data.js',route=>route.fulfill({contentType:'application/javascript',body:'window.MATCHES=[];'}));
  await page.route('**/community.js',route=>route.fulfill({contentType:'application/javascript',body:'/* isolated freshness test */'}));
  await page.goto('/community.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.P2UCommunityFreshness&&typeof window.P2UCommunityFreshness.refresh==='function');
  await page.evaluate(()=>{
    const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    const y=new Date(d);y.setDate(y.getDate()-1);
    const yesterday=[y.getFullYear(),String(y.getMonth()+1).padStart(2,'0'),String(y.getDate()).padStart(2,'0')].join('-');
    window.MATCHES=[
      {home:'Fresh Home',away:'Fresh Away',matchDate:today,status:'NS'},
      {home:'Old Home',away:'Old Away',matchDate:yesterday,status:'FT'}
    ];
    const h=document.getElementById('top-picks');
    h.innerHTML='<div class="pick"><span class="rank">1</span><div class="who"><div class="t">Fresh Home v Fresh Away</div></div></div><div class="pick"><span class="rank">2</span><div class="who"><div class="t">Old Home v Old Away</div></div></div>';
    window.P2UCommunityFreshness.refresh();
  });
  await expect(page.locator('#top-picks>.pick:not([hidden])')).toHaveCount(1);
  await expect(page.locator('#top-picks')).toContainText('Fresh Home');
  await expect(page.locator('#p2u-community-freshness')).toContainText("Today's Community Consensus");
});
