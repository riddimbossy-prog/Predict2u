#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const checks = [];

function check(name, ok, detail = '') {
  checks.push({ name, ok: Boolean(ok), detail });
  if (!ok) console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
}

const buildVersion = exists('BUILD_VERSION.txt')
  ? read('BUILD_VERSION.txt').trim()
  : '';
const normalizedVersion = /^v\d+(?:\.\d+)?$/i.test(buildVersion)
  ? buildVersion.toLowerCase()
  : 'v200';
const expectedCache = `predict2u-${normalizedVersion}`;

const required = [
  'manifest.webmanifest',
  'sw.js',
  'pwa-launch.js',
  'pwa-launch.css',
  'offline.html',
  'app-readiness-admin.js',
  'app-readiness-admin.css',
  'icon-192.png',
  'icon-512.png',
  'maskable-icon.png'
];
required.forEach(file => check(`required file ${file}`, exists(file)));

let manifest = {};
try {
  manifest = JSON.parse(read('manifest.webmanifest'));
  check('manifest JSON', true);
} catch (error) {
  check('manifest JSON', false, error.message);
}

check('build version available', Boolean(buildVersion), buildVersion || 'BUILD_VERSION.txt is empty or missing');
check('standalone display', manifest.display === 'standalone', String(manifest.display));
check('four app shortcuts', Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 4, String(manifest.shortcuts && manifest.shortcuts.length));
check('share target', Boolean(manifest.share_target));
check('maskable icon declared', Array.isArray(manifest.icons) && manifest.icons.some(icon => String(icon.purpose || '').includes('maskable')));

const sw = read('sw.js');
const cachePattern = new RegExp(`CACHE_VERSION\\s*=\\s*['\"]${expectedCache.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['\"]`);
check(`${normalizedVersion} worker cache`, cachePattern.test(sw), `expected ${expectedCache}`);
check('worker version matches build', sw.includes(`VERSION='${normalizedVersion}'`) || sw.includes(`VERSION="${normalizedVersion}"`), `expected ${normalizedVersion}`);
check('offline navigation fallback', sw.includes("OFFLINE_URL='./offline.html'") || sw.includes('OFFLINE_URL="./offline.html"'));
check('notification deep links', sw.includes('notificationclick') && sw.includes('targetURL'));
check('background sync handler', sw.includes('p2u-sync-outbox'));
check('runtime cache clearing', sw.includes('CLEAR_RUNTIME_CACHES'));

const pwa = read('pwa-launch.js');
check('install prompt', pwa.includes('beforeinstallprompt'));
check('update prompt', pwa.includes('SKIP_WAITING'));
check('network state', pwa.includes("addEventListener('offline'") || pwa.includes('addEventListener("offline"'));
check('app badge API', pwa.includes('setAppBadge'));
// The IndexedDB name is intentionally stable so queued offline actions survive app releases.
check('offline outbox', pwa.includes("indexedDB.open('p2u-app-v200'") || pwa.includes('indexedDB.open("p2u-app-v200"'));

const pages = ['index.html', 'board.html', 'engines.html', 'proof.html', 'community.html', 'news.html', 'account.html'];
pages.forEach(file => {
  const source = read(file);
  check(`${file} manifest`, source.includes('manifest.webmanifest'));
  check(`${file} app controller`, source.includes('pwa-launch.js'));
});

const admin = read('admin.html');
check('admin app readiness CSS', admin.includes('app-readiness-admin.css'));
check('admin app readiness JS', admin.includes('app-readiness-admin.js'));
check('admin operations console label', /Operations console\s*·\s*v\d+/i.test(admin));

const news = read('news-app-v198.js');
check('news offline comment queue', news.includes("queueOffline('news-comment'") || news.includes('queueOffline("news-comment"'));
check('news offline follow queue', news.includes("queueOffline('news-follow'") || news.includes('queueOffline("news-follow"'));
check('news offline bookmark queue', news.includes("queueOffline('news-bookmark'") || news.includes('queueOffline("news-bookmark"'));

const failed = checks.filter(item => !item.ok);
const report = {
  version: normalizedVersion,
  expected_cache: expectedCache,
  generated_at: new Date().toISOString(),
  checks,
  passed: checks.length - failed.length,
  failed: failed.length
};
fs.writeFileSync(path.join(root, 'pwa-readiness-report.json'), JSON.stringify(report, null, 2));

if (failed.length) {
  console.error(`${failed.length} PWA readiness checks failed.`);
  process.exit(1);
}

console.log(`PWA readiness self-test passed: ${checks.length} checks for ${normalizedVersion}.`);
