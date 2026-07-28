/* Predict2U v272 — Auto Picks Gatekeeper v2.1.
   Public bundle exposes only release mechanics. Private learning policy remains server-side. */
(function(factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined'){window.P2UAutoGatekeeperV272=api;window.P2UAutoGatekeeperV271=api;}
})(function(){
  'use strict';
  const MODEL_VERSION='Auto Profile v2.1';
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));
  const num=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);
  const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||''));

  const MARKET_RULES=Object.freeze({
    HOME_WIN:{family:'result',minOdds:1.35,maxOdds:2.10,minGrade:84,minMargin:7,settle:'Home Win',conflicts:['AWAY_WIN','DCX2']},
    AWAY_WIN:{family:'result',minOdds:1.35,maxOdds:2.10,minGrade:84,minMargin:7,settle:'Away Win',conflicts:['HOME_WIN','DC1X']},
    DC1X:{family:'double',minOdds:1.18,maxOdds:1.50,minGrade:83,minMargin:6,settle:'Double Chance 1X',conflicts:['AWAY_WIN']},
    DCX2:{family:'double',minOdds:1.18,maxOdds:1.50,minGrade:83,minMargin:6,settle:'Double Chance X2',conflicts:['HOME_WIN']},
    NO_DRAW:{family:'nodraw',minOdds:1.20,maxOdds:1.60,minGrade:84,minMargin:7,settle:'Double Chance 12',conflicts:['DRAW_PRESSURE']},
    OVER15:{family:'goals',minOdds:1.20,maxOdds:1.50,minGrade:84,minMargin:6,settle:'Over 1.5 Goals',conflicts:['UNDER15']},
    UNDER15:{family:'goals',minOdds:1.70,maxOdds:2.50,minGrade:86,minMargin:7,settle:'Under 1.5 Goals',conflicts:['OVER15']},
    OVER25:{family:'goals',minOdds:1.55,maxOdds:2.10,minGrade:85,minMargin:7,settle:'Over 2.5 Goals',conflicts:['UNDER25']},
    UNDER25:{family:'goals',minOdds:1.55,maxOdds:2.10,minGrade:85,minMargin:7,settle:'Under 2.5 Goals',conflicts:['OVER25']},
    OVER35:{family:'goals',minOdds:1.80,maxOdds:3.10,minGrade:87,minMargin:8,settle:'Over 3.5 Goals',conflicts:['UNDER35']},
    UNDER35:{family:'goals',minOdds:1.30,maxOdds:1.70,minGrade:85,minMargin:7,settle:'Under 3.5 Goals',conflicts:['OVER35']},
    BTTS_YES:{family:'btts',minOdds:1.45,maxOdds:1.80,minGrade:86,minMargin:7,settle:'BTTS Yes',conflicts:['BTTS_NO']},
    BTTS_NO:{family:'btts',minOdds:1.45,maxOdds:1.90,minGrade:86,minMargin:7,settle:'BTTS No',conflicts:['BTTS_YES']},
    FH_OVER05:{family:'half',minOdds:1.25,maxOdds:1.60,minGrade:85,minMargin:6,settle:'First Half Over 0.5',conflicts:['FH_UNDER05']},
    FH_UNDER15:{family:'half',minOdds:1.25,maxOdds:1.65,minGrade:85,minMargin:6,settle:'First Half Under 1.5',conflicts:['FH_OVER15']}
  });

  function approvedRoute(homeTrait,awayTrait){
    const h=String(homeTrait||''),a=String(awayTrait||'');
    const is=(x,list)=>list.includes(x);
    if(is(h,['wins','unbeaten'])&&is(a,['losses','winless']))return{id:'home-control',allowed:['HOME_WIN','DC1X']};
    if(is(h,['losses','winless'])&&is(a,['wins','unbeaten']))return{id:'away-control',allowed:['AWAY_WIN','DCX2']};
    if(h==='winless'&&a==='nodraws')return{id:'winless-v-no-draw-away',allowed:['DCX2','NO_DRAW']};
    if(h==='nodraws'&&a==='winless')return{id:'no-draw-v-winless-home',allowed:['DC1X','NO_DRAW']};
    if(h==='nodraws'&&a==='nodraws')return{id:'no-draw',allowed:['NO_DRAW']};
    if(h==='gg'&&a==='gg')return{id:'gg',allowed:['BTTS_YES']};
    if(h==='ng'&&a==='ng')return{id:'ng',allowed:['BTTS_NO']};
    if(h==='fhover05'&&a==='fhover05')return{id:'first-half-over',allowed:['FH_OVER05']};
    if(h==='fhunder15'&&a==='fhunder15')return{id:'first-half-under',allowed:['FH_UNDER15']};
    if(h==='htwins'&&a==='htdefeats')return{id:'home-first-half-control',allowed:['FH_OVER05','HOME_WIN','DC1X']};
    if(h==='htdefeats'&&a==='htwins')return{id:'away-first-half-control',allowed:['FH_OVER05','AWAY_WIN','DCX2']};
    if(h==='scored'&&a==='conceded')return{id:'home-score-route',allowed:['OVER15','HOME_WIN','DC1X']};
    if(h==='conceded'&&a==='scored')return{id:'away-score-route',allowed:['OVER15','AWAY_WIN','DCX2']};
    if(h==='failedscore'&&a==='cleansheet')return{id:'home-blank-route',allowed:['BTTS_NO','DCX2']};
    if(h==='cleansheet'&&a==='failedscore')return{id:'away-blank-route',allowed:['BTTS_NO','DC1X']};
    if(h==='over35'&&a==='over35')return{id:'over35',allowed:['OVER35','OVER25','OVER15']};
    if(is(h,['over25','over35'])&&is(a,['over25','over35']))return{id:'over25',allowed:['OVER25','OVER15']};
    if(is(h,['over15','over25','over35'])&&is(a,['over15','over25','over35']))return{id:'over15',allowed:['OVER15']};
    if(h==='under15'&&a==='under15')return{id:'under15',allowed:['UNDER15','UNDER25','UNDER35']};
    if(is(h,['under15','under25'])&&is(a,['under15','under25']))return{id:'under25',allowed:['UNDER25','UNDER35']};
    if(is(h,['under15','under25','under35'])&&is(a,['under15','under25','under35']))return{id:'under35',allowed:['UNDER35']};
    return null;
  }

  function priceBand(v){
    const n=num(v);if(n===null)return null;
    if(n<1.20)return'<1.20';if(n<1.45)return'1.20-1.44';if(n<1.70)return'1.45-1.69';if(n<2.00)return'1.70-1.99';if(n<2.50)return'2.00-2.49';return'2.50+';
  }
  function calibrationFor(m,canonical,odds){
    const all=m&&m.oddsCalib&&m.oddsCalib[canonical];
    if(!all||typeof all!=='object')return{available:false,pass:true,sample:0,hit:null,edge:null};
    const band=priceBand(odds),row=band&&all[band];
    if(!row)return{available:false,pass:true,sample:0,hit:null,edge:null};
    const sample=num(row.n)||0,hit=num(row.hit),implied=odds?1/Number(odds):null;
    if(hit===null||implied===null)return{available:false,pass:true,sample,hit,edge:null};
    const edge=hit-implied;
    const pass=sample>=8?edge>=.03:sample>=5?edge>=-.03:true;
    return{available:sample>=5,pass,sample,hit,edge};
  }

  function formStats(value){
    const s=String(value||'').toUpperCase().replace(/[^WDL]/g,'');
    if(!s)return{sample:0,win:null,draw:null,loss:null,unbeaten:null};
    const wins=[...s].filter(x=>x==='W').length,draws=[...s].filter(x=>x==='D').length,losses=s.length-wins-draws;
    return{sample:s.length,win:wins/s.length,draw:draws/s.length,loss:losses/s.length,unbeaten:(wins+draws)/s.length};
  }

  function recentConfirmation(candidate,h,a){
    const id=candidate.id;
    if(!['HOME_WIN','AWAY_WIN','DC1X','DCX2'].includes(id))return{pass:true,label:'Split and league confirmation'};
    const hf=h&&h.recentForm||formStats(h&&h.form),af=a&&a.recentForm||formStats(a&&a.form);
    const hp=num(h&&h.recentPPG),ap=num(a&&a.recentPPG);
    if(id==='HOME_WIN'){
      const pass=(hp!==null&&ap!==null&&hp-ap>=.45)||(hf.sample>=5&&hf.win>=.50&&af.loss>=.40);
      return{pass,label:pass?'Recent form supports the home edge':'Recent form does not confirm the home edge'};
    }
    if(id==='AWAY_WIN'){
      const pass=(hp!==null&&ap!==null&&ap-hp>=.45)||(af.sample>=5&&af.win>=.50&&hf.loss>=.40);
      return{pass,label:pass?'Recent form supports the away edge':'Recent form does not confirm the away edge'};
    }
    if(id==='DC1X'){
      const pass=(hp!==null&&ap!==null&&hp>=ap-.10)||(hf.sample>=5&&hf.unbeaten>=.60);
      return{pass,label:pass?'Recent form supports home protection':'Recent form weakens home protection'};
    }
    const pass=(hp!==null&&ap!==null&&ap>=hp-.10)||(af.sample>=5&&af.unbeaten>=.60);
    return{pass,label:pass?'Recent form supports away protection':'Recent form weakens away protection'};
  }

  function dataQuality({m,h,a,meta,today,automatic=false}){
    const reasons=[],blocks=[];
    const sample=Math.min(num(h&&h.games)||0,num(a&&a.games)||0);
    const fixtureDate=String(m&&m.matchDate||m&&m.kickoff||'').slice(0,10);
    const sourceUpdated=meta&&meta.sourceUpdatedAt?new Date(meta.sourceUpdatedAt).getTime():NaN;
    const ageHours=Number.isFinite(sourceUpdated)?Math.max(0,(Date.now()-sourceUpdated)/3600000):null;
    const current=validDate(fixtureDate)&&fixtureDate>=today;
    const kickoffMs=m&&m.kickoff?new Date(m.kickoff).getTime():NaN;
    const preKickoff=!Number.isFinite(kickoffMs)||kickoffMs>Date.now()+10*60000;
    const live=['1H','HT','2H','ET','BT','P','LIVE','INT'].includes(String(m&&m.status||'').toUpperCase());
    const metricValues=[h&&h.ppg,h&&h.gf,h&&h.ga,a&&a.ppg,a&&a.gf,a&&a.ga,h&&h.win,h&&h.loss,a&&a.win,a&&a.loss];
    const completeness=metricValues.filter(x=>num(x)!==null).length/metricValues.length;
    const leagueSample=num(m&&m.leagueTrends&&m.leagueTrends.sample)||num(m&&m.leagueAvg&&m.leagueAvg.gamesPlayed)||0;
    const oddsCount=m&&m.odds?Object.values(m.odds).filter(x=>num(x)!==null&&Number(x)>1).length:0;
    const profilePenalty=[h&&h.profileSource,a&&a.profileSource].filter(x=>String(x||'').includes('fallback')).length;
    let grade=0;
    grade+=sample>=12?25:sample>=8?20:Math.max(0,sample*2);
    grade+=Math.round(completeness*20);
    grade+=leagueSample>=50?15:leagueSample>=25?11:leagueSample>=15?7:0;
    grade+=oddsCount>=10?15:oddsCount>=6?11:oddsCount>=3?6:0;
    grade+=profilePenalty===0?15:profilePenalty===1?9:5;
    grade+=(num(h&&h.recentPPG)!==null||h&&h.recentForm&&h.recentForm.sample>=5)&&(num(a&&a.recentPPG)!==null||a&&a.recentForm&&a.recentForm.sample>=5)?10:5;
    grade=clamp(grade);
    if(sample<8)blocks.push('Minimum venue sample not met');
    if(completeness<.70)blocks.push('Core split statistics are incomplete');
    if(oddsCount<3)blocks.push('Market odds coverage is too low');
    if(automatic){
      if(!current)blocks.push('Fixture is outside the current publishing window');
      if(!preKickoff||live)blocks.push('Fixture has already started');
      if(ageHours===null||ageHours>36)blocks.push('Data refresh is not recent enough');
    }else{
      if(!current)reasons.push('Historical or fallback fixture');
      if(ageHours===null||ageHours>36)reasons.push('Data may be stale');
    }
    if(profilePenalty)reasons.push('One or more profiles use fallback data');
    if(leagueSample<25)reasons.push('League sample is limited');
    return{grade,blocks,reasons,ageHours,leagueSample,oddsCount,completeness:Number(completeness.toFixed(2)),sample};
  }

  function candidateGrade(candidate,quality){return Math.round(clamp((num(candidate.score)||0)*.78+quality.grade*.22));}

  function select({m,h,a,homeTrait,awayTrait,candidates,meta,today,automatic=false}){
    const route=approvedRoute(homeTrait,awayTrait);
    const quality=dataQuality({m,h,a,meta,today,automatic});
    const warnings=[...quality.reasons];
    if(!route)return{primary:null,route:null,quality,warnings:[...warnings,'This profile pair has no approved prediction route.'],rejected:'NO_APPROVED_ROUTE'};
    if(quality.blocks.length)return{primary:null,route,quality,warnings:[...warnings,...quality.blocks],rejected:'DATA_QUALITY_FAILED'};
    const byId=new Map((candidates||[]).map(c=>[c.id,c]));
    const evaluated=[];
    for(const id of route.allowed){
      const c=byId.get(id),rule=MARKET_RULES[id];if(!c||!rule||num(c.odds)===null)continue;
      const odds=Number(c.odds);
      if(odds<rule.minOdds||odds>rule.maxOdds)continue;
      const recent=recentConfirmation(c,h,a);if(!recent.pass)continue;
      const calibration=calibrationFor(m,c.canonical||rule.settle,odds);if(!calibration.pass)continue;
      const grade=candidateGrade(c,quality);
      if(grade<rule.minGrade)continue;
      const conflict=(rule.conflicts||[]).map(k=>byId.get(k)).filter(Boolean).sort((x,y)=>candidateGrade(y,quality)-candidateGrade(x,quality))[0]||null;
      const conflictGrade=conflict?candidateGrade(conflict,quality):0;
      const margin=grade-conflictGrade;
      if(margin<rule.minMargin)continue;
      const valueNote=calibration.available?`Historical price-band check ${calibration.edge>=0?'supports':'does not weaken'} this market`:'No mature price-band sample; stronger grade required';
      const effectiveMin=calibration.available?rule.minGrade:rule.minGrade+2;
      if(grade<effectiveMin)continue;
      evaluated.push({...c,score:grade,rawScore:num(c.score)||0,grade,margin,rule,routeId:route.id,quality,calibration,recent,valueNote,settleMarket:rule.settle});
    }
    evaluated.sort((x,y)=>y.grade-x.grade||y.margin-x.margin||y.odds-x.odds);
    const primary=evaluated[0]||null;
    if(!primary)return{primary:null,route,quality,warnings,rejected:'NO_MARKET_CLEARED'};
    return{primary,route,quality,warnings,rejected:null,evaluated};
  }

  function buildDailyCore(rows,max=4){
    const ordered=[...(rows||[])].sort((a,b)=>(b.primary&&b.primary.grade||0)-(a.primary&&a.primary.grade||0)||(b.rank||0)-(a.rank||0));
    const selected=[],leagues=new Map(),families=new Map(),markets=new Map();
    for(const row of ordered){
      if(selected.length>=max)break;
      const league=String(row&&row.m&&row.m.league||'Unknown');
      const family=String(row&&row.primary&&row.primary.rule&&row.primary.rule.family||'other');
      const market=String(row&&row.primary&&row.primary.id||row&&row.primary&&row.primary.market||'');
      if((leagues.get(league)||0)>=1)continue;
      if((families.get(family)||0)>=2)continue;
      if((markets.get(market)||0)>=1)continue;
      selected.push(row);leagues.set(league,(leagues.get(league)||0)+1);families.set(family,(families.get(family)||0)+1);markets.set(market,(markets.get(market)||0)+1);
    }
    return selected.length>=3?selected:[];
  }

  return{MODEL_VERSION,MARKET_RULES,approvedRoute,priceBand,calibrationFor,formStats,dataQuality,recentConfirmation,candidateGrade,select,buildDailyCore};
});
