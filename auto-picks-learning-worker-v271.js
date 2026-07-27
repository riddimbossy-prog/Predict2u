/* Predict2U v271 — private Auto Picks learning supervisor.
   Detailed profile, route, market and pricing performance remains private.
   Public output contains only compact results and fixture-specific decisions. */
'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const crypto=require('crypto');
const ROOT=__dirname;
const MODEL_VERSION='Auto Profile v2.0';
const BUILD='v271';
const DRY=process.env.DRY_RUN==='1'||process.argv.includes('--dry-run');
const SUPA_URL=process.env.SUPABASE_URL||'';
const SECRET=process.env.SUPABASE_SECRET_KEY||'';
const FOOTBALL_KEY=process.env.API_FOOTBALL_KEY||process.env.API_KEY||'';
const POLICY_B64=process.env.AUTO_LEARNING_POLICY_B64||'';
function loadPolicy(){try{return POLICY_B64?JSON.parse(Buffer.from(POLICY_B64,'base64').toString('utf8')):null;}catch(_){return null;}}
const POLICY=loadPolicy();
const PRIVATE_REPORT=process.env.PRIVATE_REPORT_PATH||path.join(ROOT,'.private','auto-picks-learning-report-v271.json');
const PUBLIC_JSON=path.join(ROOT,'auto-picks-learning-public-v271.json');
const GUARD_JS=path.join(ROOT,'auto-picks-learning-guard-v271.js');
const HMAC_KEY=POLICY_B64||SECRET||'predict2u-v271-dry-run';

function loadData(){
  const file=fs.existsSync(path.join(ROOT,'current-data.js'))?'current-data.js':'data.js';
  const sandbox={window:{},console};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),sandbox,{filename:file});
  return{matches:Array.isArray(sandbox.window.MATCHES)?JSON.parse(JSON.stringify(sandbox.window.MATCHES)):[],meta:JSON.parse(JSON.stringify(sandbox.window.P2U_DATA_META||{}))};
}
function headlessSelections(matches,meta){
  const sandbox={window:{MATCHES:matches,P2U_DATA_META:meta,P2U_HEADLESS_AUTO_V271:true},location:{search:'',href:'https://predict2u.com/team-rankings.html'},URLSearchParams,URL,console,Date,Set,Map,Math,Number,String,Object,Array,RegExp,JSON,CustomEvent:function(){}};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'auto-picks-gatekeeper-v271.js'),'utf8'),sandbox,{filename:'auto-picks-gatekeeper-v271.js'});
  vm.runInContext(fs.readFileSync(path.join(ROOT,'team-rankings.js'),'utf8'),sandbox,{filename:'team-rankings.js'});
  const api=sandbox.window.P2UAutoHeadlessV271;if(!api||typeof api.automaticSelections!=='function')throw new Error('Headless Auto Picks v271 export is unavailable.');
  return JSON.parse(JSON.stringify(api.automaticSelections()));
}
function fixtureKey(m){return m&&m.id!=null?`f${m.id}`:`${m.home}|${m.away}|${String(m.matchDate||m.kickoff||'').slice(0,10)}`;}
function oddsBand(v){const n=Number(v);if(!Number.isFinite(n))return'na';if(n<1.20)return'<1.20';if(n<1.45)return'1.20-1.44';if(n<1.70)return'1.45-1.69';if(n<2.00)return'1.70-1.99';if(n<2.50)return'2.00-2.49';return'2.50+';}
function hmac(value){return crypto.createHmac('sha256',HMAC_KEY).update(String(value)).digest('hex');}
function leagueClass(row){const sample=Number(row&&row.m&&row.m.leagueTrends&&row.m.leagueTrends.sample||0),gpg=Number(row&&row.m&&row.m.leagueTrends&&row.m.leagueTrends.gpg||row&&row.m&&row.m.leagueAvg&&row.m.leagueAvg.goalsPerGame||0);return`${sample>=50?'mature':sample>=25?'standard':'thin'}:${gpg>=3?'high':gpg&&gpg<2.35?'low':'balanced'}`;}
function rawGroupKeys(row){
  const market=row.primary.settleMarket||row.primary.canonical||row.primary.market,band=oddsBand(row.primary.odds),route=row.routeId||'unknown',league=row.m.league||'unknown',klass=leagueClass(row);
  return{exact:`exact|${route}|${market}|${league}|${band}`,route:`route|${route}|${market}|${band}`,market:`market|${market}|${klass}|${band}`};
}
function signature(row){return hmac(rawGroupKeys(row).exact);}
function settleMarket(row){return row.primary.settleMarket||row.primary.canonical||row.primary.market;}
function compactCandidate(c){return{id:c.id,market:c.market,raw:Number(c.rawScore||c.score)||null,grade:Number(c.grade||c.score)||null,odds:Number(c.odds)||null,margin:Number(c.margin)||null};}
function pickPayload(row){
  const m=row.m,groups=rawGroupKeys(row),quality=row.quality||{};
  return{fixture_key:fixtureKey(m),fixture_id:m.id==null?null:String(m.id),model_version:MODEL_VERSION,config_version:BUILD,route_id:row.routeId||null,data_quality:quality.grade||null,candidate_margin:row.margin||null,match_date:String(m.matchDate||m.kickoff||'').slice(0,10)||null,kickoff:m.kickoff||null,league:m.league||'',home_team:m.home||'',away_team:m.away||'',home_profile:row.homeTrait,away_profile:row.awayTrait,market:row.primary.market,settle_market:settleMarket(row),odds:Number(row.primary.odds)||null,model_strength:Number(row.primary.score)||null,signature_hash:hmac(groups.exact),status:'open',context:{configVersion:BUILD,routeId:row.routeId,marketFamily:row.primary.rule&&row.primary.rule.family||'',oddsBand:oddsBand(row.primary.odds),leagueClass:leagueClass(row),sample:row.sample,margin:row.margin,dataQuality:quality.grade||null,dataQualityNotes:quality.reasons||[],profilePair:{home:row.homeTrait,away:row.awayTrait},projection:row.projection,candidates:(row.supporting||[]).map(compactCandidate),release:{grade:row.primary.score,rawGrade:row.primary.rawScore||null,calibration:row.primary.calibration||null,recent:row.primary.recent||null},groupHashes:{exact:hmac(groups.exact),route:hmac(groups.route),market:hmac(groups.market)}}};
}
function matchIndex(matches){const map=new Map();for(const m of matches)map.set(fixtureKey(m),m);return map;}
const H=()=>({'apikey':SECRET,'Authorization':`Bearer ${SECRET}`,'Content-Type':'application/json'});
async function sb(method,route,body,prefer){const r=await fetch(`${SUPA_URL}/rest/v1/${route}`,{method,headers:{...H(),...(prefer?{'Prefer':prefer}:{})},body:body==null?undefined:JSON.stringify(body)});if(!r.ok)throw new Error(`${method} ${route} -> ${r.status} ${await r.text()}`);if(r.status===204)return null;const t=await r.text();return t?JSON.parse(t):null;}
async function upsertPicks(picks){if(picks.length)await sb('POST','auto_pick_snapshots?on_conflict=fixture_key,model_version',picks,'resolution=ignore-duplicates,return=minimal');}
async function patchById(id,body){await sb('PATCH',`auto_pick_snapshots?id=eq.${encodeURIComponent(id)}`,body,'return=minimal');}
function normalizeApiFixture(x){if(!x)return null;return{id:x.fixture&&x.fixture.id,status:x.fixture&&x.fixture.status&&x.fixture.status.short,kickoff:x.fixture&&x.fixture.date,matchDate:String(x.fixture&&x.fixture.date||'').slice(0,10),home:x.teams&&x.teams.home&&x.teams.home.name,away:x.teams&&x.teams.away&&x.teams.away.name,homeGoals:x.goals&&x.goals.home,awayGoals:x.goals&&x.goals.away};}
async function fetchFixtureDirect(id){
  if(!FOOTBALL_KEY||!id)return null;
  const r=await fetch(`https://v3.football.api-sports.io/fixtures?id=${encodeURIComponent(id)}`,{headers:{'x-apisports-key':FOOTBALL_KEY}});
  if(!r.ok)throw new Error(`API-Football fixture ${id} -> ${r.status}`);
  const data=await r.json();return normalizeApiFixture(data&&data.response&&data.response[0]);
}
function settleOne(m,market){
  if(!m)return'';const status=String(m.status||'').toUpperCase();if(['PST','CANC','ABD','SUSP','INT','AWD','WO'].includes(status))return'Void';
  if(m.homeGoals==null||m.awayGoals==null||!['FT','AET','PEN'].includes(status))return'';
  const eng=require('./banker-engine.js');return eng.settle(market,m.homeGoals,m.awayGoals,status,m)||'';
}
function dueForDirectCheck(r){const k=Date.parse(r.kickoff||'');return Number.isFinite(k)?k<Date.now()-90*60000:String(r.match_date||'')<new Date().toISOString().slice(0,10);}
function resultProfit(r){if(r.result==='Won')return(Math.max(1,Number(r.odds)||1)-1);if(r.result==='Lost')return-1;return 0;}
function maxLosingStreak(rows){let max=0,run=0;for(const r of [...rows].sort((a,b)=>String(a.settled_at||a.match_date).localeCompare(String(b.settled_at||b.match_date)))){if(r.result==='Lost'){run++;max=Math.max(max,run);}else if(r.result==='Won')run=0;}return max;}
function groupHashes(r){const c=r.context||{},stored=c.groupHashes||{};return[stored.exact||r.signature_hash,stored.route,stored.market].filter(Boolean);}
function groupStats(settled){
  const groups=new Map();for(const r of settled){if(!['Won','Lost'].includes(r.result))continue;for(const hash of groupHashes(r)){const g=groups.get(hash)||{hash,rows:[],wins:0,losses:0,total:0,profit:0};g.rows.push(r);g.total++;g.profit+=resultProfit(r);if(r.result==='Won')g.wins++;else g.losses++;groups.set(hash,g);}}
  const out=new Map(),privateGroups=[];for(const g of groups.values()){
    const smoothed=POLICY?(g.wins+Number(POLICY.pw))/(g.total+Number(POLICY.ps)):null,roi=g.total?g.profit/g.total:null,maxLoss=maxLosingStreak(g.rows);let state='s',delta=0;
    if(POLICY){
      if(g.total>=Number(POLICY.mb)&&(smoothed<Number(POLICY.bb)||roi<-.12||maxLoss>=6)){state='b';delta=-99;}
      else if(g.total>=Number(POLICY.mw)&&(smoothed<Number(POLICY.wb)||roi<-.04||maxLoss>=4)){state='w';delta=Number(POLICY.wd);}
      else if(g.total>=Number(POLICY.mp)&&smoothed>Number(POLICY.ba)&&roi>.03&&maxLoss<=3){state='p';delta=Number(POLICY.bd);}
    }
    const row={hash:g.hash,wins:g.wins,losses:g.losses,total:g.total,profit:Number(g.profit.toFixed(3)),roi:roi==null?null:Number(roi.toFixed(4)),smoothed:smoothed==null?null:Number(smoothed.toFixed(4)),maxLosingStreak:maxLoss,state,delta};out.set(g.hash,row);privateGroups.push(row);
  }return{map:out,privateGroups};
}
function fixtureDecision(pick,stats){
  const hashes=Object.values(pick.context&&pick.context.groupHashes||{}).filter(Boolean),decisions=hashes.map(h=>stats.map.get(h)).filter(Boolean);
  if(decisions.some(x=>x.state==='b'))return{s:'b',d:-99};const watches=decisions.filter(x=>x.state==='w');if(watches.length)return{s:'w',d:Math.min(...watches.map(x=>x.delta||-3))};
  const boosts=decisions.filter(x=>x.state==='p');if(boosts.length>=2)return{s:'p',d:Math.min(2,Math.max(...boosts.map(x=>x.delta||1)))};return{s:'s',d:0};
}
function buildFixtureGuard(picks,settled){const stats=groupStats(settled),fixtures={};if(POLICY)for(const pick of picks)fixtures[pick.fixture_key]=fixtureDecision(pick,stats);return{fixtures,privateGroups:stats.privateGroups,policyLoaded:!!POLICY};}
function publicSummary(settled){
  const decided=settled.filter(r=>r.result==='Won'||r.result==='Lost'),wins=decided.filter(r=>r.result==='Won').length,losses=decided.length-wins,voids=settled.filter(r=>r.result==='Void').length,profit=decided.reduce((a,r)=>a+resultProfit(r),0),roi=decided.length?profit/decided.length:null;
  return{schema:2,build:BUILD,modelVersion:MODEL_VERSION,generatedAt:new Date().toISOString(),status:decided.length>=50?'stable':decided.length>=20?'active':'monitoring',settled:decided.length,wins,losses,voids,roi:roi==null?null:Number(roi.toFixed(4)),recent:settled.slice(0,12).map(r=>({fixtureKey:r.fixture_key,home:r.home_team,away:r.away_team,market:r.market,result:r.result,score:r.home_goals==null?'':`${r.home_goals}-${r.away_goals}`,date:r.match_date,odds:r.odds}))};
}
function writeOutputs(summary,guard,privateData){
  fs.writeFileSync(PUBLIC_JSON,JSON.stringify(summary,null,2)+'\n');
  fs.writeFileSync(GUARD_JS,`/* Auto-generated by the private learning workflow. Public decisions are fixture-specific and reveal no reusable profile rules. */\nwindow.P2U_AUTO_LEARNING_GUARD_V271=${JSON.stringify({schema:2,modelVersion:MODEL_VERSION,generatedAt:summary.generatedAt,fixtures:guard.fixtures})};\n`);
  fs.mkdirSync(path.dirname(PRIVATE_REPORT),{recursive:true});fs.writeFileSync(PRIVATE_REPORT,JSON.stringify(privateData,null,2)+'\n');
}

(async()=>{
  const data=loadData(),rows=headlessSelections(data.matches,data.meta),picks=rows.map(pickPayload);console.log(`Loaded ${data.matches.length} matches and generated ${picks.length} current Auto Picks v2 selection(s).`);
  if((!SUPA_URL||!SECRET)&&!DRY)throw new Error('Missing SUPABASE_URL / SUPABASE_SECRET_KEY. Apply the private learning migration and configure repository secrets.');
  let settled=[];
  if(SUPA_URL&&SECRET){
    if(!DRY)await upsertPicks(picks);
    const open=await sb('GET','auto_pick_snapshots?status=eq.open&select=*')||[],index=matchIndex(data.matches);
    for(const r of open){
      let m=index.get(r.fixture_key),source='public-bundle',result=settleOne(m,r.settle_market);
      if(!result&&dueForDirectCheck(r)&&FOOTBALL_KEY){try{m=await fetchFixtureDirect(r.fixture_id);source='api-football';result=settleOne(m,r.settle_market);}catch(e){console.warn(e.message);}}
      if(!result||!m)continue;
      const body={result,status:result==='Void'?'void':'settled',home_goals:m.homeGoals,away_goals:m.awayGoals,profit_units:resultProfit({...r,result}),settlement_source:source,settled_at:new Date().toISOString(),context:{...(r.context||{}),settlementSource:source}};
      if(!DRY)await patchById(r.id,body);Object.assign(r,body);
    }
    settled=await sb('GET','auto_pick_snapshots?status=in.(settled,void)&select=*&order=settled_at.desc&limit=5000')||[];
  }
  const guard=buildFixtureGuard(picks,settled),summary=publicSummary(settled),privateData={generatedAt:summary.generatedAt,modelVersion:MODEL_VERSION,policyLoaded:guard.policyLoaded,currentPickCount:picks.length,settledCount:settled.length,groups:guard.privateGroups,currentPicks:picks};
  writeOutputs(summary,guard,privateData);console.log(`Learning status written: ${summary.settled} settled, ${Object.keys(guard.fixtures).length} fixture decisions, private policy ${guard.policyLoaded?'loaded':'not loaded'}.`);
})().catch(e=>{console.error(`Auto Picks learning worker v271 failed: ${e.message}`);process.exit(1);});
