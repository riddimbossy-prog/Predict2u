const { test, expect } = require('@playwright/test');

const overview={
  version:'v186',days:30,sessions:42,page_views:120,interactions:86,engagement_rate:61.9,client_errors:2,push_enabled:7,
  top_pages:[{page_path:'/index.html',count:70},{page_path:'/community.html',count:30}],
  top_events:[{event_name:'match_opened',count:35},{event_name:'share_completed',count:12}],
  top_entities:[{entity_type:'match',entity_key:'fixture-1',count:15}],
  daily:[{day:'2026-07-11',page_views:50,sessions:20,interactions:30},{day:'2026-07-12',page_views:70,sessions:22,interactions:56}],
  device_mix:[{device_class:'mobile',sessions:28,share_pct:66.7},{device_class:'desktop',sessions:14,share_pct:33.3}],
  vitals:{lcp_p75:1800,lcp_rating:'Good',inp_p75:140,inp_rating:'Good',cls_p75:0.05,cls_rating:'Good',fcp_p75:950,fcp_rating:'Good'},
  funnel:{board_views:80,match_opens:35,records_added:10,shares_completed:12,community_posts:4}
};

async function installAdminMock(page){
  await page.addInitScript(({overview})=>{
    const settings={id:'global',board_published:true,release_version:'v186',updated_at:new Date().toISOString()};
    window.__P2U_ADMIN_MOCK__={
      session:{user:{id:'00000000-0000-0000-0000-000000000001',email:'owner@example.com'}},
      roleRow:{user_id:'00000000-0000-0000-0000-000000000001',role:'owner',active:true},
      settings,moderation:[],audit:[],deletions:[],roles:[],calls:[],
      async select(table,query){
        if(table==='p2u_site_settings')return this.settings;
        if(table==='p2u_admin_roles')return query&&query.maybeSingle?this.roleRow:this.roles;
        if(table==='p2u_push_public_config')return {id:'global',enabled:false,vapid_public_key:''};
        return query&&query.maybeSingle?null:[];
      },
      async rpc(name,args){this.calls.push({name,args});if(name==='p2u_admin_analytics_overview')return overview;if(name==='p2u_admin_push_metrics')return {};return {}}
    };
  },{overview});
}

test('analytics waits for consent and submits privacy-safe events after approval', async ({page})=>{
  let ingests=0;
  await page.route('**/rest/v1/rpc/p2u_ingest_analytics_events',async route=>{ingests++;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,accepted:1})})});
  await page.goto('/privacy.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.P2UAnalytics?.isReady?.());
  await expect(page.locator('#p2u-analytics-consent')).toHaveClass(/is-visible/);
  expect(ingests).toBe(0);
  await page.locator('[data-analytics-allow]').click();
  await page.evaluate(async()=>{window.P2UAnalytics.track('match_opened',{entityType:'match',entityKey:'fixture-test'});await window.P2UAnalytics.flush()});
  expect(ingests).toBeGreaterThan(0);
  await expect.poll(()=>page.evaluate(()=>window.P2UAnalytics.getConsent())).toBe('accepted');
});

test('browser privacy signals disable analytics', async ({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'globalPrivacyControl',{value:true,configurable:true}));
  await page.goto('/index.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.P2UAnalytics?.isReady?.());
  expect(await page.evaluate(()=>window.P2UAnalytics.getConsent())).toBe('declined');
  await expect(page.locator('#p2u-analytics-consent')).not.toHaveClass(/is-visible/);
});

test('admin analytics dashboard loads privacy-first overview', async ({page})=>{
  await installAdminMock(page);
  await page.goto('/admin.html#analytics',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.p2uBackendAdminReady==='true');
  await page.waitForFunction(()=>document.documentElement.dataset.p2uProductAnalyticsReady==='true');
  await page.locator('[data-admin-tab="analytics"]').click();
  await page.evaluate(()=>window.P2UProductAnalytics.load());
  await expect(page.locator('#analytics-sessions strong')).toHaveText('42');
  await expect(page.locator('#analytics-pageviews strong')).toHaveText('120');
  await expect(page.locator('#analytics-lcp strong')).toHaveText('1,800 ms');
  await expect(page.locator('#analytics-pages-body')).toContainText('/index.html');
});
