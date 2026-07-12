/* Predict2U service worker v200 — launch-candidate app shell, bounded runtime caches,
   exact push deep links and recoverable offline navigation. */
const VERSION='v200';
const CACHE_VERSION='predict2u-v200';
const APP_CACHE=CACHE_VERSION;
const RUNTIME_CACHE='predict2u-runtime-v200';
const IMAGE_CACHE='predict2u-images-v200';
const IMAGE_LIMIT=220;
const NETWORK_TIMEOUT=4200;
const NETWORK_TIMEOUT_MS=NETWORK_TIMEOUT;
const OFFLINE_URL='./offline.html';
const SHELL=[
  './','./index.html','./board.html','./engines.html','./proof.html','./scorecards.html','./league-dna.html',
  './community.html','./news.html','./account.html','./profile.html','./share.html','./offline.html','./admin.html',
  './trust.html','./responsible-gambling.html','./terms.html','./privacy.html','./disclaimer.html','./404.html',
  './manifest.webmanifest','./pwa-launch.js','./pwa-launch.css','./mobile-app-nav.js','./mobile-app-nav.css',
  './brand-experience.js','./brand-experience.css','./performance-freshness.js','./performance-freshness.css','./intelligence.css',
  './personalization.js','./personalization.css','./smart-alerts.js','./smart-alerts.css',
  './growth-sharing.js','./growth-sharing.css','./site-health-widget.js','./site-health.css',
  './account-cloud.js','./account-cloud.css','./cloud-config.js','./push-notifications.js','./push-notifications.css',
  './backend-admin.js','./backend-admin.css','./admin-config.js','./site-controls.js','./site-controls.css',
  './analytics.js','./analytics.css','./product-analytics.js','./product-analytics.css',
  './news.js','./news-app-v198.js','./news.css','./football-assets.js','./brand-performance.css','./community-consistency.js',
  './predict2u-logo.png','./predict2u-mark.png','./social-preview.png','./predict2u-transfers.webp','./predict2u-transfers-thumb.webp',
  './favicon.ico','./favicon-16x16.png','./favicon-32x32.png','./favicon-48x48.png','./apple-touch-icon.png',
  './icon-192.png','./icon-512.png','./maskable-icon.png'
];
const ok=r=>r&&(r.ok||r.type==='opaque');
const sameOrigin=u=>u.origin===self.location.origin;
function canonical(request){const u=new URL(request.url);u.search='';return new Request(u.href,{method:'GET',headers:request.headers,credentials:request.credentials,mode:request.mode==='navigate'?'same-origin':request.mode,redirect:request.redirect})}
const canonicalRequest=canonical;
async function timeoutFetch(request,ms=NETWORK_TIMEOUT){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{return await fetch(request,{signal:c.signal})}finally{clearTimeout(t)}}
async function cacheShell(){const cache=await caches.open(APP_CACHE);await Promise.allSettled(SHELL.map(async url=>{try{const r=await fetch(url,{cache:'reload'});if(ok(r))await cache.put(url,r)}catch(_){}}))}
async function trim(cache,limit){const keys=await cache.keys();if(keys.length>limit)await Promise.all(keys.slice(0,keys.length-limit).map(k=>cache.delete(k)))}
self.addEventListener('install',e=>{e.waitUntil(cacheShell());self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('predict2u-')&&!([APP_CACHE,RUNTIME_CACHE,IMAGE_CACHE].includes(k))).map(k=>caches.delete(k)));if(self.registration.navigationPreload)await self.registration.navigationPreload.enable();await self.clients.claim();const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});clients.forEach(c=>c.postMessage({type:'P2U_SW_ACTIVE',version:VERSION}))})()));
async function navigation(request,preload){const cache=await caches.open(APP_CACHE);try{const r=preload||await timeoutFetch(request);if(ok(r))await cache.put(canonical(request),r.clone());return r}catch(_){return await cache.match(canonical(request),{ignoreSearch:true})||await cache.match(OFFLINE_URL)||new Response('Offline',{status:503,headers:{'Content-Type':'text/plain'}})}}
async function networkFirst(request){const cache=await caches.open(RUNTIME_CACHE),key=canonical(request);try{const r=await timeoutFetch(request);if(ok(r))await cache.put(key,r.clone());return r}catch(_){return await cache.match(key,{ignoreSearch:true})||new Response('Temporarily unavailable',{status:503,headers:{'Content-Type':'text/plain'}})}}
async function staleWhileRevalidate(request){const cache=await caches.open(RUNTIME_CACHE),key=canonical(request),cached=await cache.match(key,{ignoreSearch:true});const update=fetch(request).then(async r=>{if(ok(r)){await cache.put(key,r.clone());await trim(cache,160)}return r}).catch(()=>null);return cached||(await update)||new Response('',{status:504})}
async function image(request){const cache=await caches.open(IMAGE_CACHE),cached=await cache.match(request,{ignoreSearch:true});const update=fetch(request,{mode:sameOrigin(new URL(request.url))?request.mode:'no-cors',credentials:sameOrigin(new URL(request.url))?request.credentials:'omit'}).then(async r=>{if(ok(r)){await cache.put(request,r.clone());await trim(cache,IMAGE_LIMIT)}return r}).catch(()=>null);return cached||(await update)||new Response('',{status:504})}
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;if(r.mode==='navigate'){e.respondWith((async()=>navigation(r,await e.preloadResponse))());return}if(r.destination==='image'){e.respondWith(image(r));return}if(!sameOrigin(u))return;if(/(?:data\.js|site-health\.json|push-event-snapshot\.json|engine-learning-report\.json|model-governance-report\.json|engine-consensus-report\.json|match-context-report\.json)$/.test(u.pathname)){e.respondWith(networkFirst(r));return}if(['script','style','font','worker'].includes(r.destination)||/\.(?:js|css|woff2?|json|webmanifest)$/.test(u.pathname)){e.respondWith(staleWhileRevalidate(r));return}e.respondWith(staleWhileRevalidate(r))});
async function clearRuntime(){await Promise.all([caches.delete(RUNTIME_CACHE),caches.delete(IMAGE_CACHE)])}
async function prefetch(urls){const cache=await caches.open(APP_CACHE);await Promise.allSettled(urls.slice(0,12).map(async raw=>{const u=new URL(raw,self.location.origin);if(!sameOrigin(u))return;const req=new Request(u.href,{credentials:'same-origin'}),r=await fetch(req);if(ok(r))await cache.put(canonical(req),r)}))}
self.addEventListener('message',e=>{const d=e.data;if(d==='SKIP_WAITING'){self.skipWaiting();return}if(d&&d.type==='GET_VERSION'){if(e.ports&&e.ports[0])e.ports[0].postMessage({version:VERSION,cache:APP_CACHE});return}if(d&&d.type==='PREFETCH_URLS'&&Array.isArray(d.urls)){e.waitUntil(prefetch(d.urls));return}if(d&&d.type==='CLEAR_RUNTIME_CACHES'){e.waitUntil(clearRuntime());return}});
async function notifyClients(type,detail={}){const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});clients.forEach(c=>c.postMessage(Object.assign({type},detail)));return clients}
self.addEventListener('sync',e=>{if(e.tag!=='p2u-sync-outbox')return;e.waitUntil((async()=>{const clients=await notifyClients('P2U_FLUSH_OUTBOX',{version:VERSION});if(!clients.length)await self.registration.showNotification('Predict2U is ready to sync',{body:'Open the app to finish your saved offline changes.',icon:'./icon-192.png',badge:'./favicon-48x48.png',tag:'p2u-sync-ready',data:{url:'./account.html'}})})())});
self.addEventListener('periodicsync',e=>{if(e.tag==='p2u-refresh-shell')e.waitUntil(cacheShell())});
self.addEventListener('push',e=>e.waitUntil((async()=>{let p={};try{p=e.data?e.data.json():{}}catch(_){try{p={body:e.data?e.data.text():''}}catch(__){}}const reason=p.data&&p.data.reason?String(p.data.reason):'';const data=Object.assign({},p.data||{},{url:p.url||(p.data&&p.data.url)||'./index.html',category:p.category||'system',pushId:p.id||''});await self.registration.showNotification(String(p.title||'Predict2U update').slice(0,100),{body:(String(p.body||'')+(reason?' • '+reason:'')).slice(0,240),icon:p.icon||'./icon-192.png',badge:p.badge||'./favicon-48x48.png',tag:p.id||'p2u-'+(p.category||'system'),renotify:false,requireInteraction:p.category==='match',data,actions:[{action:'open',title:'Open Predict2U'}]});await notifyClients('P2U_PUSH_RECEIVED',{payload:Object.assign({},p,{data})})})()));
function targetURL(raw){try{const u=new URL(raw||'./index.html',self.location.origin);return sameOrigin(u)?u.href:new URL('./index.html',self.location.origin).href}catch(_){return new URL('./index.html',self.location.origin).href}}
self.addEventListener('notificationclick',e=>{e.notification.close();const url=targetURL(e.notification.data&&e.notification.data.url);e.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows){if('navigate'in client)await client.navigate(url);if('focus'in client)return client.focus()}return self.clients.openWindow?self.clients.openWindow(url):null})())});
self.addEventListener('notificationclose',e=>{const d=e.notification&&e.notification.data||{};e.waitUntil(notifyClients('P2U_PUSH_CLOSED',{id:d.pushId||'',category:d.category||'system'}))});
