/* Predict2U v264 — release secret and unsafe-file scan. */
'use strict';
const fs=require('fs'),path=require('path');
const ROOT=__dirname;const errors=[];
const forbidden=['config.txt','.env','.env.local','push-secrets.txt','api-cache.json','odds-api-cache.json'];
for(const name of forbidden)if(fs.existsSync(path.join(ROOT,name)))errors.push(`Forbidden release file present: ${name}`);
const scanExt=new Set(['.js','.json','.yml','.yaml','.md','.txt','.html']);
const ignore=new Set(['release-security-scan.js']);
const patterns=[
  /(?:API_KEY|ODDS_API_KEY|STATS_API_KEY|TOKEN|SECRET)\s*[=:]\s*["']?[A-Za-z0-9_\-]{20,}/i,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /ghp_[A-Za-z0-9]{20,}/
];
for(const name of fs.readdirSync(ROOT)){
  if(ignore.has(name)||!scanExt.has(path.extname(name)))continue;
  const full=path.join(ROOT,name);if(!fs.statSync(full).isFile()||fs.statSync(full).size>2_000_000)continue;
  const text=fs.readFileSync(full,'utf8');for(const re of patterns)if(re.test(text)){errors.push(`Possible secret in ${name}`);break;}
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}console.log('Release security scan passed.');
