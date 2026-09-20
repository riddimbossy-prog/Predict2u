#!/usr/bin/env node
'use strict';
const assert=require('assert');
const Gate=require('./auto-picks-gatekeeper-v272.js');
const today=new Date().toISOString().slice(0,10);
const kickoff=new Date(Date.now()+3*3600000).toISOString();
const side={games:12,ppg:2.1,gf:1.9,ga:.8,win:.65,loss:.15,unbeaten:.85,recentPPG:2,recentForm:{sample:5,win:.6,draw:.2,loss:.2,unbeaten:.8},profileSource:'home',};
const weak={games:12,ppg:.8,gf:.8,ga:1.8,win:.15,loss:.6,unbeaten:.4,recentPPG:.8,recentForm:{sample:5,win:.2,draw:.2,loss:.6,unbeaten:.4},profileSource:'away'};
const baseMatch={id:1,matchDate:today,kickoff,status:'NS',odds:{home:1.55,away:5,dc1x:1.25},leagueTrends:{sample:80,gpg:2.6,rates:{}},oddsCalib:{}};
const candidates=[
  {id:'HOME_WIN',market:'Home to win',canonical:'Home Win',score:96,odds:1.55,reasons:['clear edge']},
  {id:'AWAY_WIN',market:'Away to win',canonical:'Away Win',score:45,odds:5,reasons:['weak counter']},
  {id:'DC1X',market:'Home or Draw',canonical:'Double Chance 1X',score:90,odds:1.25,reasons:['protection']}
];
const meta={sourceUpdatedAt:new Date().toISOString()};
let result=Gate.select({m:baseMatch,h:side,a:weak,homeTrait:'wins',awayTrait:'losses',candidates,meta,today,automatic:true});
assert(result.primary,'approved strong route should select');
assert.strictEqual(result.primary.id,'HOME_WIN');
assert(result.primary.grade>=84);
assert.strictEqual(Gate.approvedRoute('winless','nodraws').id,'winless-v-no-draw-away');
result=Gate.select({m:baseMatch,h:side,a:weak,homeTrait:'draws',awayTrait:'gg',candidates,meta,today,automatic:true});
assert.strictEqual(result.primary,null,'unapproved route must return No Bet');
assert.strictEqual(result.rejected,'NO_APPROVED_ROUTE');
const badCal={...baseMatch,oddsCalib:{'Home Win':{'1.45-1.69':{n:10,hit:.4}}}};
result=Gate.select({m:badCal,h:side,a:weak,homeTrait:'wins',awayTrait:'losses',candidates,meta,today,automatic:true});
assert(!result.primary||result.primary.id!=='HOME_WIN','mature negative price band must block home win');
const stale={sourceUpdatedAt:new Date(Date.now()-72*3600000).toISOString()};
result=Gate.select({m:baseMatch,h:side,a:weak,homeTrait:'wins',awayTrait:'losses',candidates,meta:stale,today,automatic:true});
assert.strictEqual(result.primary,null,'stale data must not publish automatically');
assert.strictEqual(result.rejected,'DATA_QUALITY_FAILED');
const mk=(id,league,family,market,grade)=>({m:{id,league},primary:{id:market,grade,score:grade,rule:{family}},rank:grade});
const core=Gate.buildDailyCore([
  mk(1,'League A','goals','OVER15',95),mk(2,'League A','goals','UNDER35',94),mk(3,'League B','result','HOME_WIN',93),mk(4,'League C','btts','BTTS_YES',92),mk(5,'League D','double','DC1X',91)
],4);
assert.strictEqual(core.length,4,'core should build four diversified picks');
assert.strictEqual(new Set(core.map(x=>x.m.league)).size,4,'core must limit one pick per league');
assert.strictEqual(Gate.buildDailyCore(core.slice(0,2),4).length,0,'fewer than three picks must not form a Daily Core');

const labOpen=Gate.select({m:baseMatch,h:side,a:weak,homeTrait:'draws',awayTrait:'gg',candidates,meta:stale,today,lab:true});
assert(labOpen.primary,'Lab must classify an unapproved pair via open scan');
assert.strictEqual(labOpen.route.id,'open-lab');
assert.strictEqual(labOpen.route.source,'open');
assert.strictEqual(labOpen.primary.id,'HOME_WIN');
assert(Array.isArray(labOpen.rejectedMarkets),'Lab returns rejected markets with reasons');
assert(labOpen.rejectedMarkets.length>=1);

const labStaleApproved=Gate.select({m:baseMatch,h:side,a:weak,homeTrait:'wins',awayTrait:'losses',candidates,meta:stale,today,lab:true});
assert(labStaleApproved.primary,'stale data must not block Lab');
assert.strictEqual(labStaleApproved.route.source,'approved');

const autoStillBlocked=Gate.select({m:baseMatch,h:side,a:weak,homeTrait:'draws',awayTrait:'gg',candidates,meta,today,automatic:true,lab:true});
assert.strictEqual(autoStillBlocked.primary,null,'lab flag must not loosen automatic=true');

const thin=Gate.select({
  m:{...baseMatch,odds:{home:1.55,away:4.2,dc1x:1.22,over15:1.28,over25:1.8,bttsYes:1.6}},
  h:{...side,games:4,recentForm:{sample:2,win:.5,draw:0,loss:.5,unbeaten:.5}},
  a:{...weak,games:4,recentForm:{sample:2,win:.2,draw:.2,loss:.6,unbeaten:.4}},
  homeTrait:'',
  awayTrait:'',
  candidates:[
    {id:'HOME_WIN',market:'Home to win',canonical:'Home Win',score:88,odds:1.55,reasons:[]},
    {id:'OVER15',market:'Over 1.5 Goals',canonical:'Over 1.5 Goals',score:91,odds:1.28,reasons:[]}
  ],
  meta,today,lab:true
});
assert(thin.rejected==='NO_MARKET_CLEARED'||thin.primary,'thin sample still evaluates');
assert(thin.observation,'Lab always returns a closest-market observation');

console.log('Auto Picks Gatekeeper v271 tests passed.');
console.log('Matchup Lab gatekeeper tests passed.');
