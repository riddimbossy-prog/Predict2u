#!/usr/bin/env node
"use strict";
const assert=require("assert"),path=require("path");
const ROOT=path.resolve(__dirname,"..");
// Simulate the existing 16-engine registry so the extension can be tested independently.
globalThis.P2U_ENGINE_REGISTRY=Array.from({length:16},(_,i)=>({key:`base${i+1}`,name:`Base ${i+1}`,fn:`base${i+1}`}));
const suite=require(path.join(ROOT,"multi-engine-suite.js"));
assert.equal(globalThis.P2U_ENGINE_REGISTRY.length,20,"integrated registry must contain 20 engines");
assert.equal(suite.P2U_MULTI_ENGINE_REGISTRY.length,4,"extension must contain four engines");
assert(!globalThis.P2U_ENGINE_REGISTRY.some(e=>/decision core/i.test(e.name)),"Decision Core must not be registered as an engine");
for(const fn of ["controlEdgeRecommend","leagueSignalMatrixRecommend","marketFlowRecommend","goalCompressionRecommend"]){assert.equal(typeof suite[fn],"function",`${fn} must be exported`);}
const match={
  id:243001,home:"Alpha FC",away:"Beta FC",league:"Premier Test League",matchDate:"2026-07-14",status:"NS",tableSize:20,
  homeVenueGames:12,awayVenueGames:12,homeVenuePPG:2.25,awayVenuePPG:.92,homeOverallPPG:2.10,awayOverallPPG:1.00,
  homeRecent10PPG:2.20,awayRecent10PPG:.90,homeScoredAtHome:1.95,homeConcededAtHome:.72,awayScoredAway:.82,awayConcededAway:1.75,
  homeWinRate:.68,awayWinRate:.24,homeUnbeatenRate:.84,awayUnbeatenRate:.43,homeCleanSheetRate:.46,awayCleanSheetRate:.18,
  homeFailedToScoreRate:.12,awayFailedToScoreRate:.39,homeOver15Rate:.82,awayOver15Rate:.67,homeOver25Rate:.61,awayOver25Rate:.48,
  homeGD:22,awayGD:-13,homePts:50,awayPts:24,homePos:2,awayPos:17,homeXG:1.88,awayXG:.86,statsReal:true,
  odds:{home:1.55,draw:3.80,away:6.20,dc1x:1.07,dcx2:2.35,dc12:1.25,over15:1.22,over25:1.72,over35:2.65,under25:2.04,under35:1.38,bttsYes:1.94,bttsNo:1.76},
  leagueAvg:{goalsPerGame:2.75,drawRate:.26,homeWinRate:.48,gamesPlayed:220},
  leagueTrends:{sample:220,sampleCurrent:70,currentShare:.70,rates:{"Home Win":.48,"Away Win":.27,"Over 1.5":.76,"Over 2.5":.58,"Over 3.5":.31,"Under 2.5":.42,"Under 3.5":.69,"BTTS Yes":.55,"BTTS No":.45},top3:[{market:"Over 1.5",rate:.76},{market:"Home Win",rate:.48}]}
};
const rows=[suite.controlEdgeRecommend(match),suite.leagueSignalMatrixRecommend(match),suite.marketFlowRecommend(match),suite.goalCompressionRecommend(match)];
for(const r of rows){
  assert(r&&typeof r==="object","every engine must return an object");
  for(const k of ["engine","engineName","version","primary","confidence","bet","banker","reasons","warnings"])assert(k in r,`${r.engine||"engine"} missing ${k}`);
  assert(Array.isArray(r.reasons)&&Array.isArray(r.warnings),"reasons and warnings must be arrays");
}
const decision=suite.runMultiEngineDecisionCore(match,rows);
assert(["published","no_bet"].includes(decision.status),"Decision Core must return a stable status");
const weak={home:"Thin",away:"Sparse",league:"Friendly",status:"NS",odds:{home:2,away:3}};
for(const fn of [suite.controlEdgeRecommend,suite.leagueSignalMatrixRecommend,suite.marketFlowRecommend,suite.goalCompressionRecommend]){
  const r=fn(weak);assert.equal(r.bet,false,"missing data must produce No Bet");assert.equal(r.primary,"No Bet");
}
console.log("PASS: 4 engines integrated; registry 20; Decision Core remains an orchestrator; No Bet gates verified.");
