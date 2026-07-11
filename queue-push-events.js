#!/usr/bin/env node
'use strict';
/* Predict2U v183 — queue meaningful match-status push jobs from data.js.
   Intended for GitHub Actions. Uses SUPABASE_SERVICE_ROLE_KEY only in the runner.
   The key is never written to the repository or public browser files. */
const fs=require('fs'),path=require('path');
const HERE=__dirname;
const SNAPSHOT=path.join(HERE,'push-event-snapshot.json');
const DATA=path.join(HERE,'data.js');
const URL=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const DISPATCH_SECRET=process.env.PUSH_DISPATCH_SECRET||'';

function readMatches(){
  const raw=fs.readFileSync(DATA,'utf8');
  const m=raw.match(/window\.MATCHES\s*=\s*([\s\S]*?);\s*$/m);
  if(!m)throw new Error('Could not parse window.MATCHES from data.js');
  return JSON.parse(m[1]);
}
function readSnapshot(){try{return JSON.parse(fs.readFileSync(SNAPSHOT,'utf8'))}catch(_){return{version:'v183',initialized:false,matches:{}}}}
function keyOf(m){return String(m.fixtureId??m.id??`${m.home}|${m.away}|${m.matchDate||m.kickoff||''}`)}
function statusOf(m){return String(m.status||'NS').toUpperCase()}
function enginesOf(m){
  const values=[];
  for(const source of [m.engines,m.engineVotes,m.passedEngines,m.supportingEngines]){
    if(Array.isArray(source))for(const item of source){if(typeof item==='string')values.push(item);else if(item&&item.engine)values.push(item.engine);else if(item&&item.name)values.push(item.name)}
  }
  return [...new Set(values.map(x=>String(x).trim()).filter(Boolean))].slice(0,16);
}
function snap(m){return{status:statusOf(m),homeGoals:m.homeGoals??null,awayGoals:m.awayGoals??null,home:String(m.home||''),away:String(m.away||''),league:String(m.league||m.competition||''),engines:enginesOf(m),updatedAt:new Date().toISOString()}}
function meaningful(prev,next){
  if(!prev)return null;
  const statusChanged=prev.status!==next.status;
  if(!statusChanged)return null;
  const s=next.status;
  if(['PST','CANC','ABD','SUSP','INT','AWD','WO'].includes(s))return{kind:'schedule',title:`${next.home} v ${next.away}: status update`,body:`Match status changed to ${s}.`};
  if(['1H','LIVE','HT','2H','ET','P'].includes(s))return{kind:'live',title:`${next.home} v ${next.away} is live`,body:'A followed match has started or changed live status.'};
  if(['FT','AET','PEN'].includes(s))return{kind:'final',title:`${next.home} v ${next.away}: final`,body:`Final score ${next.homeGoals??'—'}–${next.awayGoals??'—'}.`};
  return null;
}
async function insertJobs(jobs){
  if(!jobs.length)return;
  if(!URL||!SERVICE_KEY){console.log(`Push secrets missing; ${jobs.length} event(s) detected but not queued.`);return}
  const res=await fetch(`${URL}/rest/v1/p2u_push_jobs`,{method:'POST',headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(jobs)});
  if(!res.ok)throw new Error(`Supabase push queue failed: ${res.status} ${await res.text()}`);
  console.log(`Queued ${jobs.length} push event(s).`);
}
async function dispatch(){
  if(!URL||!SERVICE_KEY||!DISPATCH_SECRET){console.log('Push dispatcher secrets incomplete; queued jobs will wait.');return}
  const res=await fetch(`${URL}/functions/v1/p2u-push-dispatch`,{method:'POST',headers:{apikey:SERVICE_KEY,Authorization:`Bearer ${SERVICE_KEY}`,'x-p2u-push-secret':DISPATCH_SECRET,'Content-Type':'application/json'},body:JSON.stringify({limit:20})});
  if(!res.ok)throw new Error(`Push dispatch failed: ${res.status} ${await res.text()}`);
  const out=await res.json();console.log(`Push dispatcher claimed ${Number(out.claimed||0)} job(s).`);
}
(async()=>{
  if(!fs.existsSync(DATA)){console.log('data.js not found; skipping push event bridge.');return}
  const matches=readMatches(),previous=readSnapshot(),next={version:'v183',initialized:true,generatedAt:new Date().toISOString(),matches:{}};
  const jobs=[];
  for(const match of matches){
    const key=keyOf(match),current=snap(match);next.matches[key]=current;
    if(!previous.initialized)continue;
    const event=meaningful(previous.matches&&previous.matches[key],current);if(!event)continue;
    jobs.push({category:'match',title:event.title.slice(0,100),body:event.body.slice(0,240),url:'index.html',audience:{type:'favorite_match',league:current.league,engines:current.engines},payload:{source:'live-scores',fixture_key:key,status:current.status,home:current.home,away:current.away,homeGoals:current.homeGoals,awayGoals:current.awayGoals,league:current.league,event:event.kind},status:'pending',scheduled_for:new Date().toISOString()});
  }
  fs.writeFileSync(SNAPSHOT,JSON.stringify(next,null,2)+'\n');
  if(!previous.initialized){console.log(`Seeded push snapshot with ${matches.length} matches; no notifications sent on first run.`);return}
  await insertJobs(jobs);await dispatch();if(!jobs.length)console.log('No meaningful push events detected.');
})().catch(err=>{console.error(err.stack||err.message||err);process.exit(1)});
