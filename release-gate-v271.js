/* Predict2U v271 release gate. */
'use strict';
const fs=require('fs'),path=require('path'),ROOT=__dirname,errors=[];
const need=['team-rankings.html','team-rankings.js','auto-picks-gatekeeper-v271.js','auto-picks-gatekeeper-v271.css','auto-picks-learning-v271.js','auto-picks-learning-v271.css','auto-picks-learning-guard-v271.js','auto-picks-learning-public-v271.json','auto-picks-learning-worker-v271.js','auto-picks-gatekeeper-v271.test.js','supabase/auto-picks-learning-v271.sql','.github/workflows/auto-picks-learning.yml','sw.js'];
for(const f of need)if(!fs.existsSync(path.join(ROOT,f)))errors.push(`Missing ${f}`);
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const html=read('team-rankings.html'),js=read('team-rankings.js'),gate=read('auto-picks-gatekeeper-v271.js'),worker=read('auto-picks-learning-worker-v271.js'),guard=read('auto-picks-learning-guard-v271.js'),sw=read('sw.js');
for(const token of ['Daily Core','All Qualified','Settled','team-auto-add-core','slip.js','auto-picks-gatekeeper-v271.js'])if(!html.includes(token))errors.push(`Team Intelligence missing ${token}`);
if(!/autoFixturePool\(\)\.map\(autoSelectionFor\)/.test(js))errors.push('Auto Picks does not use its current-fixture-only pool.');
if(!/const autoFixturePool=\(\)=>/.test(js)||!/currentPool\.filter\(preKickoff\)/.test(js))errors.push('Current pre-kickoff Auto Picks gate is missing.');
if(/model strength|% strength/i.test(js)||/80%\+ model strength/i.test(html))errors.push('Uncalibrated percentage-strength wording remains public.');
for(const token of ['approvedRoute','MARKET_RULES','buildDailyCore','calibrationFor','recentConfirmation','dataQuality'])if(!gate.includes(token))errors.push(`Gatekeeper missing ${token}`);
if(!gate.includes("homeTrait==='winless'")&&!gate.includes("h==='winless'&&a==='nodraws'"))errors.push('Winless versus No Draws route is missing.');
if(!guard.includes('fixtures')||guard.includes('entries'))errors.push('Public guard must be fixture-specific and contain no reusable group entries.');
for(const token of ['API_FOOTBALL_KEY','fetchFixtureDirect','createHmac','profit','maxLosingStreak','fixtureDecision'])if(!worker.includes(token))errors.push(`Private worker missing ${token}`);
if(/hashed guard decisions|entries:guard/i.test(worker))errors.push('Worker still publishes reusable group decisions.');
if(!sw.includes("const VERSION='v271'")||!sw.includes('predict2u-v271'))errors.push('Service worker cache was not bumped to v271.');
for(const token of ['auto-picks-gatekeeper-v271.js','auto-picks-learning-v271.js','auto-picks-learning-guard-v271.js'])if(!sw.includes(token))errors.push(`Service worker missing ${token}`);
try{const j=JSON.parse(read('auto-picks-learning-public-v271.json'));if(j.schema!==2)errors.push('Public learning schema is not v2.');}catch(e){errors.push('Public learning JSON is invalid.');}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}console.log('Predict2U v271 release gate passed.');
