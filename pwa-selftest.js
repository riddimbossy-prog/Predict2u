#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=__dirname;
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[];
function check(name,ok,detail=''){checks.push({name,ok:Boolean(ok),detail});if(!ok)console.error(`FAIL: ${name}${detail?` — ${detail}`:''}`)}
const required=['manifest.webmanifest','sw.js','pwa-launch.js','pwa-launch.css','offline.html','app-readiness-admin.js','app-readiness-admin.css','icon-192.png','icon-512.png','maskable-icon.png'];
required.forEach(f=>check(`required file ${f}`,fs.existsSync(path.join(root,f))));
let manifest={};try{manifest=JSON.parse(read('manifest.webmanifest'));check('manifest JSON',true)}catch(e){check('manifest JSON',false,e.message)}
check('standalone display',manifest.display==='standalone',String(manifest.display));
check('four app shortcuts',Array.isArray(manifest.shortcuts)&&manifest.shortcuts.length>=4,String(manifest.shortcuts&&manifest.shortcuts.length));
check('share target',Boolean(manifest.share_target));
check('maskable icon declared',Array.isArray(manifest.icons)&&manifest.icons.some(i=>String(i.purpose||'').includes('maskable')));
const sw=read('sw.js');check('v200 worker cache',sw.includes("CACHE_VERSION='predict2u-v200'"));check('offline navigation fallback',sw.includes("OFFLINE_URL='./offline.html'"));check('notification deep links',sw.includes("notificationclick")&&sw.includes('targetURL'));check('background sync handler',sw.includes("p2u-sync-outbox"));check('runtime cache clearing',sw.includes('CLEAR_RUNTIME_CACHES'));
const pwa=read('pwa-launch.js');check('install prompt',pwa.includes('beforeinstallprompt'));check('update prompt',pwa.includes('SKIP_WAITING'));check('network state',pwa.includes("addEventListener('offline'"));check('app badge API',pwa.includes('setAppBadge'));check('offline outbox',pwa.includes("indexedDB.open('p2u-app-v200'"));
const pages=['index.html','board.html','engines.html','proof.html','community.html','news.html','account.html'];
pages.forEach(f=>{const s=read(f);check(`${f} manifest`,s.includes('manifest.webmanifest'));check(`${f} app controller`,s.includes('pwa-launch.js'));});
const admin=read('admin.html');check('admin app readiness CSS',admin.includes('app-readiness-admin.css'));check('admin app readiness JS',admin.includes('app-readiness-admin.js'));check('admin v200 label',admin.includes('Operations console · v200'));
const news=read('news-app-v198.js');check('news offline comment queue',news.includes("queueOffline('news-comment'"));check('news offline follow queue',news.includes("queueOffline('news-follow'"));check('news offline bookmark queue',news.includes("queueOffline('news-bookmark'"));
const failed=checks.filter(c=>!c.ok);const report={version:'v200',generated_at:new Date().toISOString(),checks,passed:checks.length-failed.length,failed:failed.length};fs.writeFileSync(path.join(root,'pwa-readiness-report.json'),JSON.stringify(report,null,2));if(failed.length){console.error(`${failed.length} PWA readiness checks failed.`);process.exit(1)}console.log(`PWA readiness self-test passed: ${checks.length} checks.`);
