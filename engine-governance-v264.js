/* Predict2U v264 — public engine governance and independent model families. */
(function(root){
  'use strict';
  const policies={
    normal:['SHADOW','PPG','Superseded by Pro. Kept for validation history.'],
    strict:['SHADOW','PPG','Superseded by Pro. Kept for validation history.'],
    ultra:['SHADOW','PPG','Superseded by Pro. Kept for validation history.'],
    elite:['SHADOW','PPG','Superseded by Pro. Kept for validation history.'],
    apex:['SHADOW','PPG','Superseded by Pro. Kept for validation history.'],
    prime:['SHADOW','PPG','Superseded by Pro. Kept for validation history.'],
    expert:['SHADOW','PPG','Superseded by Pro. Kept for validation history.'],
    pro:['ACTIVE','PPG','Current public PurePPG generation.'],
    trend:['ACTIVE','FORM_TRENDS','Split and league trend specialist.'],
    streaks:['ACTIVE','FORM_TRENDS','Sequence and recurrence specialist.'],
    mismatch:['SHADOW','STRENGTH_MISMATCH','Older mismatch version superseded by v2.'],
    halves:['ACTIVE','HALVES','Direct first/second-half specialist.'],
    'league-bias':['ACTIVE','LEAGUE_CONTEXT','League tendency and team-fit specialist.'],
    momentum:['ACTIVE','FORM_TRENDS','Acceleration and reversal specialist.'],
    'odds-iq':['SHADOW','MARKET_ODDS','Needs stable multi-book coverage before public ranking.'],
    value:['SHADOW','MARKET_ODDS','Needs a larger forward-settled sample.'],
    controlEdge:['ACTIVE','STRENGTH_MISMATCH','Team superiority and control specialist.'],
    leagueSignalMatrix:['ACTIVE','LEAGUE_CONTEXT','Exact league-market signal specialist.'],
    marketFlow:['ACTIVE','MARKET_ODDS','Odds routing with mandatory statistical confirmation.'],
    goalCompression:['ACTIVE','GOAL_PROFILE','Dedicated total-goal profile specialist.'],
    ggMachine:['SHADOW','BTTS','Strict BTTS machine in forward shadow testing.'],
    mismatchEngine:['ACTIVE','STRENGTH_MISMATCH','Current no-borderline mismatch engine.']
  };
  const labels={PPG:'PPG',FORM_TRENDS:'Form & trends',HALVES:'Halves',LEAGUE_CONTEXT:'League context',MARKET_ODDS:'Market & odds',GOAL_PROFILE:'Goal profile',STRENGTH_MISMATCH:'Strength mismatch',BTTS:'BTTS'};
  const raw=Array.isArray(root.P2U_ENGINE_REGISTRY)?root.P2U_ENGINE_REGISTRY:[];
  const all=raw.map(engine=>{
    const p=policies[engine.key]||['SHADOW',String(engine.family||'Other').toUpperCase().replace(/\W+/g,'_'),'Awaiting governance review.'];
    return {...engine,state:p[0],independentFamily:p[1],familyLabel:labels[p[1]]||engine.family||'Other',governanceReason:p[2]};
  });
  root.P2U_ALL_ENGINE_REGISTRY=all;
  root.P2U_ENGINE_REGISTRY=all.filter(engine=>engine.state==='ACTIVE');
  root.P2U_ENGINE_FAMILIES=[...new Map(root.P2U_ENGINE_REGISTRY.map(e=>[e.independentFamily,e.familyLabel])).entries()].map(([key,label])=>({key,label}));
  root.P2UEngineGovernance={version:'v264',all,active:root.P2U_ENGINE_REGISTRY,familyOf:key=>(all.find(e=>e.key===key)||{}).independentFamily||key,labelOf:key=>(all.find(e=>e.key===key)||{}).familyLabel||key};
})(typeof window!=='undefined'?window:globalThis);
