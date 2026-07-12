const { test, expect } = require('@playwright/test');

async function waitAccount(page){
  await page.waitForFunction(()=>['true','local'].includes(document.documentElement.dataset.p2uAccountReady),null,{timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.p2uPushReady==='true'&&window.P2UPush?.isReady?.(),null,{timeout:15000});
}

test('push account controls load safely on Z Fold cover',async({page})=>{
  await page.setViewportSize({width:344,height:882});
  await page.goto('/account.html',{waitUntil:'domcontentloaded'});
  await waitAccount(page);
  await expect(page.locator('#p2u-push-account-card')).toBeVisible({timeout:10000});
  await expect(page.locator('[data-push-enable]')).toBeVisible();
  const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
  expect(overflow).toBeLessThanOrEqual(3);
});

test('service worker contains background push and notification click handlers',async({request})=>{
  const response=await request.get('/sw.js');
  expect(response.ok()).toBeTruthy();
  const source=await response.text();
  expect(source).toContain('addEventListener("push"');
  expect(source).toContain('showNotification');
  expect(source).toContain('notificationclick');
  expect(source).toContain('predict2u-v187');
});

async function installAdminMock(page){
  await page.addInitScript(()=>{
    const uid='00000000-0000-0000-0000-000000000001';
    window.__P2U_ADMIN_MOCK__={
      session:{user:{id:uid,email:'owner@example.com'}},roleRow:{user_id:uid,role:'owner',active:true},calls:[],
      settings:{id:'global',board_published:true,announcement_enabled:false,featured_engines:[],featured_leagues:[],updated_at:new Date().toISOString()},
      async select(table,query){
        if(table==='p2u_site_settings')return this.settings;
        if(table==='p2u_admin_roles')return query?.maybeSingle?this.roleRow:[];
        if(table==='p2u_push_public_config')return{enabled:true,vapid_public_key:'B'.repeat(87),updated_at:new Date().toISOString()};
        return query?.maybeSingle?null:[];
      },
      async rpc(name,args){this.calls.push({name,args});if(name==='p2u_admin_push_metrics')return{active_devices:2,pending_jobs:0,sent_total:4,failed_total:0};if(name==='p2u_admin_queue_push')return{id:1,status:'pending'};return{};}
    };
  });
}

test('owner can open push operations and queue a test notification',async({page})=>{
  await installAdminMock(page);
  await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.p2uBackendAdminReady==='true',null,{timeout:15000});
  await page.locator('[data-admin-tab="push"]').click();
  await expect(page.locator('[data-admin-panel="push"]')).toBeVisible();
  await expect(page.locator('#metric-push-devices')).toHaveText('2');
  await page.locator('#test-push').click();
  await expect.poll(()=>page.evaluate(()=>window.__P2U_ADMIN_MOCK__.calls.some(x=>x.name==='p2u_admin_queue_push'))).toBeTruthy();
});
