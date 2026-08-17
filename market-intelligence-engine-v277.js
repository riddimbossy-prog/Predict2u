/* Predict2U v277 — Market Intelligence engine.
 * Extends Team Intelligence's Next Match Edge / Season Power philosophy to prediction markets.
 * Statistical edge first; odds may veto extreme disagreement but never create an edge.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.P2UMarketIntelligenceV277=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const MIN_SAMPLE=8;
  const QUALIFY=82;
  const ELITE=90;
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
  const num=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);
  const rate=v=>{const n=num(v);return n===null?null:(n>1.00001?n/100:n);};
  const first=(...values)=>{for(const value of values){const n=num(value);if(n!==null)return n;}return null;};
  const div=(a,b)=>num(a)!==null&&num(b)!==null&&Number(b)!==0?Number(a)/Number(b):null;
  const avg=values=>{const xs=values.filter(v=>v!==null&&Number.isFinite(v));return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;};
  const dateOf=m=>String(m&&m.matchDate||m&&m.kickoff||'').slice(0,10);
  const oddsValue=(m,key)=>first(m&&m.odds&&m.odds[key]);

  function gradeRate(value,threshold,ceiling=1){
    if(value===null||value<threshold)return null;
    const span=Math.max(.001,ceiling-threshold);
    return clamp(QUALIFY+((value-threshold)/span)*(98-QUALIFY),QUALIFY,98);
  }

  function sampleBonus(games){
    if(games===null||games<MIN_SAMPLE)return 0;
    return clamp((games-MIN_SAMPLE)*.35,0,2);
  }

  function formStats(form){
    const chars=String(form||'').toUpperCase().replace(/[^WDL]/g,'').slice(-10).split('');
    if(!chars.length)return {games:0,wins:0,draws:0,losses:0,ppg:null};
    const wins=chars.filter(x=>x==='W').length,draws=chars.filter(x=>x==='D').length,losses=chars.filter(x=>x==='L').length;
    return {games:chars.length,wins,draws,losses,ppg:(wins*3+draws)/chars.length};
  }

  function sideProfile(m,side){
    const home=side==='home';
    const st=m&&m[`${side}Streaks`]||{};
    const htft=st.htft||{};
    const advanced=st.advanced||{};
    const profile=m&&m[`${side}Profile`]||{};
    const games=first(m&&m[`${side}VenueGames`],advanced.samples&&advanced.samples.splitVenue,htft.ftSample,st.sample,profile.games);
    const ppg=first(div(m&&m[`${side}VenuePts`],games),m&&m[`${side}Recent10PPG`],advanced.recent10PPG);
    const gf=home?first(m&&m.homeScoredAtHome,profile.goalsFor&&profile.goalsFor.v):first(m&&m.awayScoredAway,profile.goalsFor&&profile.goalsFor.v);
    const ga=home?first(m&&m.homeConcededAtHome,profile.goalsAg&&profile.goalsAg.v):first(m&&m.awayConcededAway,profile.goalsAg&&profile.goalsAg.v);
    const win=rate(first(m&&m[`${side}WinRate`],htft.ftWin));
    const draw=rate(first(htft.ftDraw));
    const unbeaten=rate(first(m&&m[`${side}UnbeatenRate`],win!==null&&draw!==null?win+draw:null));
    const loss=rate(first(htft.ftLoss,unbeaten!==null?1-unbeaten:null));
    const cs=rate(first(m&&m[`${side}CleanSheetRate`],htft.ftCS));
    const fts=rate(first(m&&m[`${side}FailedToScoreRate`],htft.ftFTS));
    const over15=rate(first(m&&m[`${side}Over15Rate`]));
    const over25=rate(first(m&&m[`${side}Over25Rate`]));
    const over35=rate(first(m&&m[`${side}Over35Rate`]));
    const btts=rate(first(m&&m[`${side}BTTSRate`],htft.ftBtts));
    const fhOver05=rate(first(htft.fhOver05,m&&m[`${side}FHOver05Rate`]));
    const fhUnder15=rate(first(htft.fhUnder15,m&&m[`${side}FHUnder15Rate`]));
    const form=String(m&&m[`${side}Recent10Form`]||m&&m[`${side}Form`]||'');
    const recent=formStats(form);
    const recentPPG=first(m&&m[`${side}Recent10PPG`],advanced.recent10PPG,recent.ppg);
    return {
      fixture:m,side,team:m&&m[side]||'',opponent:m&&m[home?'away':'home']||'',league:m&&m.league||'Unknown league',country:m&&m.country||'',
      kickoff:m&&m.kickoff||'',matchDate:dateOf(m),games,ppg,recentPPG,gf,ga,win,draw,loss,unbeaten,cs,fts,over15,over25,over35,
      under15:over15===null?null:1-over15,under25:over25===null?null:1-over25,under35:over35===null?null:1-over35,
      btts,noBtts:btts===null?null:1-btts,scored:fts===null?null:1-fts,conceded:cs===null?null:1-cs,
      fhOver05,fhUnder15,position:first(m&&m[`${side}Pos`]),tableSize:first(m&&m.tableSize,m&&m.venueTableSize),
      noDraw:draw===null?null:1-draw,odds:oddsValue(m,home?'home':'away')
    };
  }

  function marketDef(id,group,market,canonical,score,oddsKey,reasons,metrics,extra={}){
    if(score===null||!Number.isFinite(score)||score<QUALIFY)return null;
    return {id,group,market,canonical,score:clamp(score),oddsKey,reasons:reasons||[],metrics:metrics||[],...extra};
  }

  function seasonCandidates(profile){
    const p=profile;
    if(!p||p.games===null||p.games<MIN_SAMPLE)return [];
    const sideLabel=p.side==='home'?'Home':'Away';
    const result=[];
    const push=x=>{if(x)result.push(x);};
    const plus=sampleBonus(p.games);

    if(p.win!==null&&p.win>=.60&&p.ppg!==null&&p.ppg>=1.70){
      const score=clamp(gradeRate(p.win,.60)+Math.min(5,Math.max(0,p.ppg-1.70)*5)+plus);
      push(marketDef('WIN','result',`${sideLabel} Win`,p.side==='home'?'Home Win':'Away Win',score,p.side==='home'?'home':'away',[
        `${Math.round(p.win*100)}% venue win rate`,`${p.ppg.toFixed(2)} split PPG`
      ],[['Win rate',p.win],['PPG',p.ppg],['GF',p.gf]],{profile:p}));
    }
    if(p.unbeaten!==null&&p.unbeaten>=.78){
      const score=clamp(gradeRate(p.unbeaten,.78)+plus);
      push(marketDef('DC_SAFE','double',p.side==='home'?'Home or Draw (1X)':'Draw or Away (X2)',p.side==='home'?'Double Chance 1X':'Double Chance X2',score,p.side==='home'?'dc1x':'dcx2',[
        `${Math.round(p.unbeaten*100)}% venue unbeaten rate`
      ],[['Unbeaten',p.unbeaten],['Win rate',p.win],['PPG',p.ppg]],{profile:p}));
    }
    if(p.noDraw!==null&&p.noDraw>=.82){
      const score=clamp(gradeRate(p.noDraw,.82)+plus);
      push(marketDef('NO_DRAW','double','No Draw (12)','Double Chance 12',score,'dc12',[`${Math.round(p.noDraw*100)}% no-draw venue profile`],[['No draw',p.noDraw],['Win',p.win],['Loss',p.loss]],{profile:p}));
    }

    const seasonRate=(id,group,market,canonical,value,threshold,oddsKey,metrics)=>{
      const g=gradeRate(value,threshold);if(g!==null)push(marketDef(id,group,market,canonical,clamp(g+plus),oddsKey,[`${Math.round(value*100)}% ${market} venue rate`],metrics,{profile:p}));
    };
    seasonRate('O15','goals','Over 1.5 Goals','Over 1.5 Goals',p.over15,.80,'over15',[['O1.5',p.over15],['GF',p.gf],['GA',p.ga]]);
    seasonRate('O25','goals','Over 2.5 Goals','Over 2.5 Goals',p.over25,.70,'over25',[['O2.5',p.over25],['GF',p.gf],['GA',p.ga]]);
    seasonRate('U25','goals','Under 2.5 Goals','Under 2.5 Goals',p.under25,.65,'under25',[['U2.5',p.under25],['GF',p.gf],['GA',p.ga]]);
    seasonRate('O35','goals','Over 3.5 Goals','Over 3.5 Goals',p.over35,.55,'over35',[['O3.5',p.over35],['GF',p.gf],['GA',p.ga]]);
    seasonRate('U35','goals','Under 3.5 Goals','Under 3.5 Goals',p.under35,.80,'under35',[['U3.5',p.under35],['GF',p.gf],['GA',p.ga]]);
    seasonRate('GG','btts','GG — Both Teams to Score','BTTS Yes',p.btts,.65,'bttsYes',[['GG',p.btts],['Scores',p.scored],['Concedes',p.conceded]]);
    seasonRate('NG','btts','NG — Both Teams Not to Score','BTTS No',p.noBtts,.65,'bttsNo',[['NG',p.noBtts],['Clean sheet',p.cs],['Fail score',p.fts]]);
    seasonRate('FH_O05','firsthalf','1st Half Over 0.5 Goals','First Half Over 0.5',p.fhOver05,.70,'fhOver05',[['1H O0.5',p.fhOver05],['GF',p.gf],['GA',p.ga]]);
    seasonRate('FH_U15','firsthalf','1st Half Under 1.5 Goals','First Half Under 1.5',p.fhUnder15,.75,'fhUnder15',[['1H U1.5',p.fhUnder15],['GF',p.gf],['GA',p.ga]]);

    return result.sort((a,b)=>b.score-a.score);
  }

  function priceVeto(m,key,max){
    const price=oddsValue(m,key);
    return price!==null&&max!==null&&price>max;
  }

  function addEdge(list,config){
    const {id,group,market,canonical,score,oddsKey,reasons,metrics,maxOdds,match,h,a}=config;
    if(score===null||score<QUALIFY)return;
    if(maxOdds&&priceVeto(match,oddsKey,maxOdds))return;
    list.push(marketDef(id,group,market,canonical,score,oddsKey,reasons,metrics,{match,h,a,odds:oddsValue(match,oddsKey)}));
  }

  function edgeCandidates(m){
    const h=sideProfile(m,'home'),a=sideProfile(m,'away');
    if(!h.games||!a.games||h.games<MIN_SAMPLE||a.games<MIN_SAMPLE)return [];
    const list=[];
    const projection=((h.gf??1.25)+(a.ga??1.25))/2+((a.gf??1.10)+(h.ga??1.10))/2;
    const sample=Math.min(h.games,a.games),plus=sampleBonus(sample);
    const ppgEdge=(h.ppg??1.25)-(a.ppg??1.25),awayEdge=-ppgEdge;

    if(h.win!==null&&a.loss!==null&&h.win>=.55&&a.loss>=.40&&ppgEdge>=.45&&(h.gf??0)>=1.35&&(a.unbeaten??1)<=.62){
      const base=82+(h.win-.55)*28+(a.loss-.40)*18+Math.min(6,(ppgEdge-.45)*6)+Math.min(3,Math.max(0,(h.gf??1.35)-1.35)*2)+plus;
      addEdge(list,{id:'HOME_WIN',group:'result',market:`${h.team} to Win`,canonical:'Home Win',score:clamp(base),oddsKey:'home',maxOdds:2.20,match:m,h,a,reasons:[`${h.team} home win ${Math.round(h.win*100)}%`,`${a.team} away loss ${Math.round(a.loss*100)}%`,`Split PPG edge +${ppgEdge.toFixed(2)}`],metrics:[['Home win',h.win],['Away loss',a.loss],['PPG edge',ppgEdge]]});
    }
    if(a.win!==null&&h.loss!==null&&a.win>=.55&&h.loss>=.40&&awayEdge>=.45&&(a.gf??0)>=1.35&&(h.unbeaten??1)<=.62){
      const base=82+(a.win-.55)*28+(h.loss-.40)*18+Math.min(6,(awayEdge-.45)*6)+Math.min(3,Math.max(0,(a.gf??1.35)-1.35)*2)+plus;
      addEdge(list,{id:'AWAY_WIN',group:'result',market:`${a.team} to Win`,canonical:'Away Win',score:clamp(base),oddsKey:'away',maxOdds:2.20,match:m,h,a,reasons:[`${a.team} away win ${Math.round(a.win*100)}%`,`${h.team} home loss ${Math.round(h.loss*100)}%`,`Split PPG edge +${awayEdge.toFixed(2)}`],metrics:[['Away win',a.win],['Home loss',h.loss],['PPG edge',awayEdge]]});
    }

    if(h.unbeaten!==null&&a.win!==null&&h.unbeaten>=.75&&a.win<=.32&&ppgEdge>=.10){
      const base=82+(h.unbeaten-.75)*35+(.32-a.win)*22+Math.min(5,Math.max(0,ppgEdge-.10)*5)+plus;
      addEdge(list,{id:'DC1X',group:'double',market:`${h.team} or Draw (1X)`,canonical:'Double Chance 1X',score:clamp(base),oddsKey:'dc1x',maxOdds:1.65,match:m,h,a,reasons:[`${h.team} home unbeaten ${Math.round(h.unbeaten*100)}%`,`${a.team} away win only ${Math.round(a.win*100)}%`],metrics:[['Home unbeaten',h.unbeaten],['Away win',a.win],['PPG edge',ppgEdge]]});
    }
    if(a.unbeaten!==null&&h.win!==null&&a.unbeaten>=.75&&h.win<=.32&&awayEdge>=.10){
      const base=82+(a.unbeaten-.75)*35+(.32-h.win)*22+Math.min(5,Math.max(0,awayEdge-.10)*5)+plus;
      addEdge(list,{id:'DCX2',group:'double',market:`Draw or ${a.team} (X2)`,canonical:'Double Chance X2',score:clamp(base),oddsKey:'dcx2',maxOdds:1.65,match:m,h,a,reasons:[`${a.team} away unbeaten ${Math.round(a.unbeaten*100)}%`,`${h.team} home win only ${Math.round(h.win*100)}%`],metrics:[['Away unbeaten',a.unbeaten],['Home win',h.win],['PPG edge',awayEdge]]});
    }
    if(h.draw!==null&&a.draw!==null){
      const noDraw=avg([1-h.draw,1-a.draw]);
      if(noDraw!==null&&noDraw>=.80&&h.draw<=.22&&a.draw<=.22){
        const base=clamp(gradeRate(noDraw,.80)+plus);
        addEdge(list,{id:'DC12',group:'double',market:'No Draw (12)',canonical:'Double Chance 12',score:base,oddsKey:'dc12',maxOdds:1.65,match:m,h,a,reasons:[`Home draw rate ${Math.round(h.draw*100)}%`,`Away draw rate ${Math.round(a.draw*100)}%`],metrics:[['No draw',noDraw],['Home draw',h.draw],['Away draw',a.draw]]});
      }
    }

    const combined=(homeValue,awayValue)=>avg([homeValue,awayValue]);
    const over15=combined(h.over15,a.over15),over25=combined(h.over25,a.over25),over35=combined(h.over35,a.over35);
    const under25=combined(h.under25,a.under25),under35=combined(h.under35,a.under35);
    if(over15!==null&&over15>=.78&&(h.over15??0)>=.70&&(a.over15??0)>=.70&&projection>=2.20){
      const score=clamp(gradeRate(over15,.78)+Math.min(5,Math.max(0,projection-2.20)*5)+plus);
      addEdge(list,{id:'O15',group:'goals',market:'Over 1.5 Goals',canonical:'Over 1.5 Goals',score,oddsKey:'over15',maxOdds:1.80,match:m,h,a,reasons:[`Home O1.5 ${Math.round(h.over15*100)}%`,`Away O1.5 ${Math.round(a.over15*100)}%`,`Projected total ${projection.toFixed(2)}`],metrics:[['Combined O1.5',over15],['Home O1.5',h.over15],['Away O1.5',a.over15]]});
    }
    if(over25!==null&&over25>=.65&&(h.over25??0)>=.55&&(a.over25??0)>=.55&&projection>=2.60){
      const score=clamp(gradeRate(over25,.65)+Math.min(5,Math.max(0,projection-2.60)*5)+plus);
      addEdge(list,{id:'O25',group:'goals',market:'Over 2.5 Goals',canonical:'Over 2.5 Goals',score,oddsKey:'over25',maxOdds:2.05,match:m,h,a,reasons:[`Home O2.5 ${Math.round(h.over25*100)}%`,`Away O2.5 ${Math.round(a.over25*100)}%`,`Projected total ${projection.toFixed(2)}`],metrics:[['Combined O2.5',over25],['Projection',projection],['Sample',sample]]});
    }
    if(under25!==null&&under25>=.65&&(h.under25??0)>=.55&&(a.under25??0)>=.55&&projection<=2.45){
      const score=clamp(gradeRate(under25,.65)+Math.min(5,Math.max(0,2.45-projection)*5)+plus);
      addEdge(list,{id:'U25',group:'goals',market:'Under 2.5 Goals',canonical:'Under 2.5 Goals',score,oddsKey:'under25',maxOdds:2.05,match:m,h,a,reasons:[`Home U2.5 ${Math.round(h.under25*100)}%`,`Away U2.5 ${Math.round(a.under25*100)}%`,`Projected total ${projection.toFixed(2)}`],metrics:[['Combined U2.5',under25],['Projection',projection],['Sample',sample]]});
    }
    if(over35!==null&&over35>=.55&&(h.over35??0)>=.48&&(a.over35??0)>=.48&&projection>=3.20){
      const score=clamp(gradeRate(over35,.55)+Math.min(5,Math.max(0,projection-3.20)*4)+plus);
      addEdge(list,{id:'O35',group:'goals',market:'Over 3.5 Goals',canonical:'Over 3.5 Goals',score,oddsKey:'over35',maxOdds:2.40,match:m,h,a,reasons:[`Combined O3.5 ${Math.round(over35*100)}%`,`Projected total ${projection.toFixed(2)}`],metrics:[['Combined O3.5',over35],['Projection',projection],['Sample',sample]]});
    }
    if(under35!==null&&under35>=.78&&(h.under35??0)>=.70&&(a.under35??0)>=.70&&projection<=3.20){
      const score=clamp(gradeRate(under35,.78)+Math.min(5,Math.max(0,3.20-projection)*4)+plus);
      addEdge(list,{id:'U35',group:'goals',market:'Under 3.5 Goals',canonical:'Under 3.5 Goals',score,oddsKey:'under35',maxOdds:1.85,match:m,h,a,reasons:[`Home U3.5 ${Math.round(h.under35*100)}%`,`Away U3.5 ${Math.round(a.under35*100)}%`,`Projected total ${projection.toFixed(2)}`],metrics:[['Combined U3.5',under35],['Projection',projection],['Sample',sample]]});
    }

    const gg=combined(h.btts,a.btts);
    if(gg!==null&&gg>=.65&&(h.scored??0)>=.70&&(a.scored??0)>=.70&&(h.conceded??0)>=.60&&(a.conceded??0)>=.60){
      const score=clamp(gradeRate(gg,.65)+Math.min(4,((h.scored+a.scored+h.conceded+a.conceded)-2.6)*2)+plus);
      addEdge(list,{id:'GG',group:'btts',market:'GG — Both Teams to Score',canonical:'BTTS Yes',score,oddsKey:'bttsYes',maxOdds:2.05,match:m,h,a,reasons:[`Home GG ${Math.round(h.btts*100)}%`,`Away GG ${Math.round(a.btts*100)}%`,`Both sides score and concede frequently`],metrics:[['Combined GG',gg],['Home scores',h.scored],['Away scores',a.scored]]});
    }
    const ng=combined(h.noBtts,a.noBtts);
    if(ng!==null&&ng>=.64&&Math.max(h.fts??0,a.fts??0,h.cs??0,a.cs??0)>=.35){
      const support=Math.max(h.fts??0,a.fts??0,h.cs??0,a.cs??0);
      const score=clamp(gradeRate(ng,.64)+Math.min(5,(support-.35)*10)+plus);
      addEdge(list,{id:'NG',group:'btts',market:'NG — Both Teams Not to Score',canonical:'BTTS No',score,oddsKey:'bttsNo',maxOdds:2.05,match:m,h,a,reasons:[`Combined NG ${Math.round(ng*100)}%`,`Clean-sheet / failed-score support ${Math.round(support*100)}%`],metrics:[['Combined NG',ng],['Support',support],['Sample',sample]]});
    }

    const fhO05=combined(h.fhOver05,a.fhOver05);
    if(fhO05!==null&&fhO05>=.70&&(h.fhOver05??0)>=.65&&(a.fhOver05??0)>=.65){
      const score=clamp(gradeRate(fhO05,.70)+plus);
      addEdge(list,{id:'FH_O05',group:'firsthalf',market:'1st Half Over 0.5 Goals',canonical:'First Half Over 0.5',score,oddsKey:'fhOver05',maxOdds:1.80,match:m,h,a,reasons:[`Home 1H O0.5 ${Math.round(h.fhOver05*100)}%`,`Away 1H O0.5 ${Math.round(a.fhOver05*100)}%`],metrics:[['Combined 1H O0.5',fhO05],['Home',h.fhOver05],['Away',a.fhOver05]]});
    }
    const fhU15=combined(h.fhUnder15,a.fhUnder15);
    if(fhU15!==null&&fhU15>=.75&&(h.fhUnder15??0)>=.70&&(a.fhUnder15??0)>=.70){
      const score=clamp(gradeRate(fhU15,.75)+plus);
      addEdge(list,{id:'FH_U15',group:'firsthalf',market:'1st Half Under 1.5 Goals',canonical:'First Half Under 1.5',score,oddsKey:'fhUnder15',maxOdds:1.80,match:m,h,a,reasons:[`Home 1H U1.5 ${Math.round(h.fhUnder15*100)}%`,`Away 1H U1.5 ${Math.round(a.fhUnder15*100)}%`],metrics:[['Combined 1H U1.5',fhU15],['Home',h.fhUnder15],['Away',a.fhUnder15]]});
    }

    return list.filter(Boolean).sort((x,y)=>y.score-x.score);
  }

  function uniqueProfiles(matches){
    const map=new Map();
    for(const m of matches||[]){
      for(const side of ['home','away']){
        const p=sideProfile(m,side);if(!p.team||p.games===null||p.games<MIN_SAMPLE)continue;
        const key=`${p.league}|${p.team}|${p.side}`;
        const old=map.get(key);
        if(!old||String(p.matchDate)>String(old.matchDate)||(p.games||0)>(old.games||0))map.set(key,p);
      }
    }
    return [...map.values()];
  }

  function bestPerEntity(rows,keyFn){
    const map=new Map();
    for(const row of rows){const key=keyFn(row);const old=map.get(key);if(!old||row.score>old.score)map.set(key,row);}
    return [...map.values()].sort((a,b)=>b.score-a.score);
  }

  function buildEdgeRows(matches,group='best'){
    let rows=[];
    for(const m of matches||[]){rows.push(...edgeCandidates(m));}
    if(group!=='best')rows=rows.filter(r=>r.group===group);
    return bestPerEntity(rows,r=>String(r.match&&r.match.id!=null?r.match.id:`${r.match&&r.match.home}|${r.match&&r.match.away}|${dateOf(r.match)}`));
  }

  function buildSeasonRows(matches,group='best'){
    let rows=[];
    for(const p of uniqueProfiles(matches)){for(const c of seasonCandidates(p))rows.push(c);}
    if(group!=='best')rows=rows.filter(r=>r.group===group);
    return bestPerEntity(rows,r=>`${r.profile.league}|${r.profile.team}|${r.profile.side}`);
  }

  return {MIN_SAMPLE,QUALIFY,ELITE,dateOf,sideProfile,seasonCandidates,edgeCandidates,buildEdgeRows,buildSeasonRows,oddsValue};
});
