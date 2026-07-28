/* Predict2U v272 — Expanded Team Intelligence trends + Auto Picks Gatekeeper v2.1. */
(function(){
  'use strict';
  const Gate=window.P2UAutoGatekeeperV271;
  if(!Gate)throw new Error('Auto Picks Gatekeeper v271 is not loaded.');
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);
  const rate=v=>{const n=num(v);return n===null?null:(n>1.00001?n/100:n);};
  const first=(...values)=>{for(const value of values){const n=num(value);if(n!==null)return n;}return null;};
  const div=(a,b)=>num(a)!==null&&num(b)!==null&&Number(b)!==0?Number(a)/Number(b):null;
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
  const pct=v=>v===null?'—':`${Math.round(v*100)}%`;
  const fmt=v=>v===null?'—':Number(v).toFixed(2);
  const dateOf=m=>String(m&&m.matchDate||m&&m.kickoff||'').slice(0,10);
  const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'');
  const add=(d,n)=>{const x=new Date(`${d}T00:00:00Z`);x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);};
  const MIN_SAMPLE=8,HORIZON_DAYS=10;
  const today=new Date().toISOString().slice(0,10),windowEnd=add(today,HORIZON_DAYS);
  const terminal=new Set(['FT','AET','PEN','PST','CANC','ABD','AWD','WO']);
  const unresolved=m=>m&&m.homeGoals==null&&!terminal.has(String(m.status||'').toUpperCase());
  const currentFixture=m=>{const d=dateOf(m);return unresolved(m)&&validDate(d)&&d>=today&&d<=windowEnd;};
  const allMatches=Array.isArray(window.MATCHES)?window.MATCHES:[];
  const currentPool=allMatches.filter(currentFixture);
  const loadedPool=allMatches.filter(unresolved).sort((a,b)=>String(dateOf(b)).localeCompare(String(dateOf(a))));
  const fixturePool=currentPool.length?currentPool:loadedPool;
  const usingFallback=!currentPool.length&&loadedPool.length>0;
  const availableDates=[...new Set(fixturePool.map(dateOf).filter(validDate))].sort();
  const requestedDate=new URLSearchParams(location.search).get('date');
  let selectedDate=validDate(requestedDate)&&availableDates.includes(requestedDate)?requestedDate:'all';
  const selectedFixturePool=()=>selectedDate==='all'?fixturePool:fixturePool.filter(m=>dateOf(m)===selectedDate);
  const preKickoff=m=>{const t=Date.parse(m&&m.kickoff||'');return !Number.isFinite(t)||t>Date.now()+10*60000;};
  const autoFixturePool=()=>{
    let pool=currentPool.filter(preKickoff);
    if(selectedDate!=='all')pool=pool.filter(m=>dateOf(m)===selectedDate);
    return pool;
  };

  function sideRow(m,side){
    const home=side==='home',st=m&&m[`${side}Streaks`]||{},htft=st.htft||{},advanced=st.advanced||{};
    const team=m&&m[side];
    const games=first(m&&m[`${side}VenueGames`],advanced.samples&&advanced.samples.splitVenue,htft.ftSample,st.sample,m&&m[`${side}Profile`]&&m[`${side}Profile`].games);
    const ppg=first(div(m&&m[`${side}VenuePts`],games),m&&m[`${side}Recent10PPG`],advanced.recent10PPG);
    const profile=m&&m[`${side}Profile`]||{};
    const gf=home?first(m&&m.homeScoredAtHome,profile.goalsFor&&profile.goalsFor.v):first(m&&m.awayScoredAway,profile.goalsFor&&profile.goalsFor.v);
    const ga=home?first(m&&m.homeConcededAtHome,profile.goalsAg&&profile.goalsAg.v):first(m&&m.awayConcededAway,profile.goalsAg&&profile.goalsAg.v);
    const cs=rate(first(m&&m[`${side}CleanSheetRate`],htft.ftCS));
    const fts=rate(first(m&&m[`${side}FailedToScoreRate`],htft.ftFTS));
    const win=rate(first(m&&m[`${side}WinRate`],htft.ftWin));
    const draw=rate(first(htft.ftDraw,win!==null&&rate(m&&m[`${side}UnbeatenRate`])!==null?rate(m&&m[`${side}UnbeatenRate`])-win:null));
    const unbeaten=rate(first(m&&m[`${side}UnbeatenRate`],win!==null&&draw!==null?win+draw:null));
    const loss=rate(first(htft.ftLoss,unbeaten!==null?1-unbeaten:null));
    const over15=rate(first(m&&m[`${side}Over15Rate`]));
    const over25=rate(first(m&&m[`${side}Over25Rate`]));
    const over35=rate(first(m&&m[`${side}Over35Rate`]));
    const btts=rate(first(htft.ftBtts));
    const noBtts=btts===null?null:1-btts;
    const scored=fts===null?null:1-fts,conceded=cs===null?null:1-cs;
    // Team-specific half and HT/FT profiles. Values remain null when the feed does not supply them.
    const htWin=rate(first(htft.htWin)),htDraw=rate(first(htft.htDraw)),htLoss=rate(first(htft.htLoss));
    const htUnbeaten=htWin!==null&&htDraw!==null?htWin+htDraw:null;
    const htWinless=htWin===null?null:1-htWin,htNoDraw=htDraw===null?null:1-htDraw;
    const fhOver05=rate(first(htft.fhOver05,m&&m[`${side}FHOver05Rate`]));
    const fhUnder05=fhOver05===null?null:1-fhOver05;
    const fhUnder15=rate(first(htft.fhUnder15,m&&m[`${side}FHUnder15Rate`]));
    const fhOver15=fhUnder15===null?null:1-fhUnder15;
    const fhBtts=rate(first(htft.fhBtts,m&&m[`${side}FHBttsRate`])),fhNoBtts=fhBtts===null?null:1-fhBtts;
    const shOver05=rate(first(htft.shOver05,m&&m[`${side}SHOver05Rate`]));
    const shUnder05=shOver05===null?null:1-shOver05;
    const shUnder15=rate(first(htft.shUnder15,m&&m[`${side}SHUnder15Rate`]));
    const shOver15=shUnder15===null?null:1-shUnder15;
    const shBtts=rate(first(htft.shBtts,m&&m[`${side}SHBttsRate`])),shNoBtts=shBtts===null?null:1-shBtts;
    const cells=htft.cells||{},htftSample=first(htft.samples,htft.sample,games);
    const htft11=htftSample?div(first(cells.WW,0),htftSample):null;
    const htft22=htftSample?div(first(cells.LL,0),htftSample):null;
    const noLoss=first(st.noLoss,0),noWin=first(st.noWin,0),noDraw=first(st.noDraw,0),winStreak=first(st.win,0),lossStreak=first(st.loss,0);
    const position=first(m&&m[`${side}Pos`]),tableSize=first(m&&m.tableSize,m&&m.venueTableSize);
    const odds=first(m&&m.odds&&m.odds[home?'home':'away']);
    const form=String(first(m&&m[`${side}Recent10Form`])||m&&m[`${side}Recent10Form`]||m&&m[`${side}Form`]||'');
    const recentForm=Gate.formStats(form);
    const recentPPG=first(m&&m[`${side}Recent10PPG`],advanced.recent10PPG);
    return {fixture:m,team,league:m&&m.league||'Unknown league',country:m&&m.country||'',logo:m&&m[`${side}Logo`]||'',side,games,ppg,gf,ga,cs,fts,win,draw,loss,unbeaten,over15,over25,over35,under15:over15===null?null:1-over15,under25:over25===null?null:1-over25,under35:over35===null?null:1-over35,btts,noBtts,scored,conceded,htWin,htDraw,htLoss,htUnbeaten,htWinless,htNoDraw,fhOver05,fhUnder05,fhOver15,fhUnder15,fhBtts,fhNoBtts,shOver05,shUnder05,shOver15,shUnder15,shBtts,shNoBtts,htft11,htft22,noLoss,noWin,noDraw,winStreak,lossStreak,position,tableSize,odds,opponent:m&&m[home?'away':'home'],kickoff:m&&m.kickoff||'',matchDate:dateOf(m),recentPPG,recentForm,form,profileSource:profile.usedSplit||''};
  }
  function latestProfiles(pool=selectedFixturePool()){
    const map=new Map();
    for(const m of pool){
      for(const side of ['home','away']){
        const r=sideRow(m,side);if(!r.team)continue;
        const key=`${r.league}|${r.team}|${r.side}`;const old=map.get(key);
        if(!old||String(r.matchDate)>String(old.matchDate)||(r.games||0)>(old.games||0))map.set(key,r);
      }
    }
    return [...map.values()].filter(r=>r.games!==null&&r.games>=MIN_SAMPLE);
  }
  const top4=r=>r.position!==null&&r.position<=4;
  const bottom4=r=>r.position!==null&&r.tableSize!==null&&r.position>=Math.max(1,r.tableSize-3);

  const trends={
    wins:{label:'Wins',title:'High-win teams',copy:'Venue win rate 60%+, PPG 1.70+ and no weak sample.',filter:r=>r.win!==null&&r.win>=.60&&r.ppg!==null&&r.ppg>=1.70,sort:(a,b)=>b.win-a.win||b.ppg-a.ppg,metrics:r=>[['Win rate',pct(r.win)],['Win streak',r.winStreak],['PPG',fmt(r.ppg)]]},
    losses:{label:'Losses',title:'High-loss teams',copy:'Venue loss rate 55%+ with PPG 1.10 or lower.',filter:r=>r.loss!==null&&r.loss>=.55&&r.ppg!==null&&r.ppg<=1.10,sort:(a,b)=>b.loss-a.loss||a.ppg-b.ppg,metrics:r=>[['Loss rate',pct(r.loss)],['Loss streak',r.lossStreak],['PPG',fmt(r.ppg)]]},
    winless:{label:'Winless',title:'Winless teams',copy:'Five-match winless streak or a venue win rate of 20% or lower.',filter:r=>r.noWin>=5||(r.win!==null&&r.win<=.20),sort:(a,b)=>b.noWin-a.noWin||(a.win??1)-(b.win??1),metrics:r=>[['Winless run',r.noWin],['Win rate',pct(r.win)],['PPG',fmt(r.ppg)]]},
    unbeaten:{label:'Unbeaten',title:'Unbeaten teams',copy:'Five-match unbeaten run or an unbeaten venue rate of 80%+.',filter:r=>r.noLoss>=5||(r.unbeaten!==null&&r.unbeaten>=.80),sort:(a,b)=>b.noLoss-a.noLoss||(b.unbeaten??0)-(a.unbeaten??0),metrics:r=>[['Unbeaten run',r.noLoss],['Unbeaten',pct(r.unbeaten)],['PPG',fmt(r.ppg)]]},
    draws:{label:'Draws',title:'Draw-heavy teams',copy:'Venue draw rate of at least 35%.',filter:r=>r.draw!==null&&r.draw>=.35,sort:(a,b)=>b.draw-a.draw,metrics:r=>[['Draw rate',pct(r.draw)],['No-draw run',r.noDraw],['PPG',fmt(r.ppg)]]},
    nodraws:{label:'No Draws',title:'No-draw teams',copy:'Five matches without a draw or a venue draw rate of 15% or lower.',filter:r=>r.noDraw>=5||(r.draw!==null&&r.draw<=.15),sort:(a,b)=>b.noDraw-a.noDraw||(a.draw??1)-(b.draw??1),metrics:r=>[['No-draw run',r.noDraw],['Draw rate',pct(r.draw)],['Win rate',pct(r.win)]]},
    over15:{label:'Over 1.5',title:'Over 1.5 teams',copy:'Venue Over 1.5 rate of at least 80%.',filter:r=>r.over15!==null&&r.over15>=.80,sort:(a,b)=>b.over15-a.over15,metrics:r=>[['Over 1.5',pct(r.over15)],['Scores',fmt(r.gf)],['Concedes',fmt(r.ga)]]},
    under15:{label:'Under 1.5',title:'Under 1.5 teams',copy:'Venue Under 1.5 rate of at least 55%.',filter:r=>r.under15!==null&&r.under15>=.55,sort:(a,b)=>b.under15-a.under15,metrics:r=>[['Under 1.5',pct(r.under15)],['Scores',fmt(r.gf)],['Concedes',fmt(r.ga)]]},
    over25:{label:'Over 2.5',title:'Over 2.5 teams',copy:'Venue Over 2.5 rate of at least 70%.',filter:r=>r.over25!==null&&r.over25>=.70,sort:(a,b)=>b.over25-a.over25,metrics:r=>[['Over 2.5',pct(r.over25)],['Scores',fmt(r.gf)],['Concedes',fmt(r.ga)]]},
    under25:{label:'Under 2.5',title:'Under 2.5 teams',copy:'Venue Under 2.5 rate of at least 65%.',filter:r=>r.under25!==null&&r.under25>=.65,sort:(a,b)=>b.under25-a.under25,metrics:r=>[['Under 2.5',pct(r.under25)],['Scores',fmt(r.gf)],['Concedes',fmt(r.ga)]]},
    over35:{label:'Over 3.5',title:'Over 3.5 teams',copy:'Venue Over 3.5 rate of at least 55%.',filter:r=>r.over35!==null&&r.over35>=.55,sort:(a,b)=>b.over35-a.over35,metrics:r=>[['Over 3.5',pct(r.over35)],['Scores',fmt(r.gf)],['Concedes',fmt(r.ga)]]},
    under35:{label:'Under 3.5',title:'Under 3.5 teams',copy:'Venue Under 3.5 rate of at least 80%.',filter:r=>r.under35!==null&&r.under35>=.80,sort:(a,b)=>b.under35-a.under35,metrics:r=>[['Under 3.5',pct(r.under35)],['Scores',fmt(r.gf)],['Concedes',fmt(r.ga)]]},
    cleansheet:{label:'Clean Sheet',title:'Clean-sheet teams',copy:'Team-specific venue clean-sheet rate of at least 40%.',filter:r=>r.cs!==null&&r.cs>=.40,sort:(a,b)=>b.cs-a.cs,metrics:r=>[['Clean sheets',pct(r.cs)],['Concedes',fmt(r.ga)],['Sample',r.games]]},
    failedscore:{label:'Fail to Score',title:'Teams failing to score',copy:'Team-specific venue failed-to-score rate of at least 40%.',filter:r=>r.fts!==null&&r.fts>=.40,sort:(a,b)=>b.fts-a.fts,metrics:r=>[['Fail to score',pct(r.fts)],['Scores',fmt(r.gf)],['Sample',r.games]]},
    scored:{label:'Goals Scored',title:'Reliable scoring teams',copy:'Scores in at least 75% of venue matches and averages 1.25+ goals.',filter:r=>r.scored!==null&&r.scored>=.75&&r.gf!==null&&r.gf>=1.25,sort:(a,b)=>b.scored-a.scored||b.gf-a.gf,metrics:r=>[['Scoring rate',pct(r.scored)],['Goals scored',fmt(r.gf)],['FTS',pct(r.fts)]]},
    conceded:{label:'Goals Conceded',title:'Teams regularly conceding',copy:'Concedes in at least 75% of venue matches and averages 1.20+ conceded.',filter:r=>r.conceded!==null&&r.conceded>=.75&&r.ga!==null&&r.ga>=1.20,sort:(a,b)=>b.conceded-a.conceded||b.ga-a.ga,metrics:r=>[['Conceding rate',pct(r.conceded)],['Goals conceded',fmt(r.ga)],['Clean sheets',pct(r.cs)]]},
    htwins:{label:'Wins 1st Half',title:'First-half winning teams',copy:'Team-specific first-half win rate of at least 40%.',filter:r=>r.htWin!==null&&r.htWin>=.40,sort:(a,b)=>b.htWin-a.htWin,metrics:r=>[['1H wins',pct(r.htWin)],['1H unbeaten',pct(r.htUnbeaten)],['Sample',r.games]]},
    htunbeaten:{label:'Unbeaten 1st Half',title:'First-half unbeaten teams',copy:'Team-specific first-half unbeaten rate of at least 75%.',filter:r=>r.htUnbeaten!==null&&r.htUnbeaten>=.75,sort:(a,b)=>b.htUnbeaten-a.htUnbeaten,metrics:r=>[['1H unbeaten',pct(r.htUnbeaten)],['1H wins',pct(r.htWin)],['1H draws',pct(r.htDraw)]]},
    htdefeats:{label:'Defeats 1st Half',title:'First-half losing teams',copy:'Team-specific first-half loss rate of at least 40%.',filter:r=>r.htLoss!==null&&r.htLoss>=.40,sort:(a,b)=>b.htLoss-a.htLoss,metrics:r=>[['1H defeats',pct(r.htLoss)],['1H winless',pct(r.htWinless)],['Sample',r.games]]},
    htwinless:{label:'Winless 1st Half',title:'First-half winless teams',copy:'Team-specific first-half winless rate of at least 75%.',filter:r=>r.htWinless!==null&&r.htWinless>=.75,sort:(a,b)=>b.htWinless-a.htWinless,metrics:r=>[['1H winless',pct(r.htWinless)],['1H wins',pct(r.htWin)],['1H draws',pct(r.htDraw)]]},
    htdraws:{label:'Draws 1st Half',title:'First-half draw teams',copy:'Team-specific first-half draw rate of at least 45%.',filter:r=>r.htDraw!==null&&r.htDraw>=.45,sort:(a,b)=>b.htDraw-a.htDraw,metrics:r=>[['1H draws',pct(r.htDraw)],['1H wins',pct(r.htWin)],['1H losses',pct(r.htLoss)]]},
    htnodraws:{label:'No Draws 1st Half',title:'First-half no-draw teams',copy:'Team-specific first-half no-draw rate of at least 70%.',filter:r=>r.htNoDraw!==null&&r.htNoDraw>=.70,sort:(a,b)=>b.htNoDraw-a.htNoDraw,metrics:r=>[['1H no draw',pct(r.htNoDraw)],['1H wins',pct(r.htWin)],['1H losses',pct(r.htLoss)]]},
    fhunder05:{label:'1H Under 0.5',title:'First-half Under 0.5 teams',copy:'No first-half goal in at least 45% of venue matches.',filter:r=>r.fhUnder05!==null&&r.fhUnder05>=.45,sort:(a,b)=>b.fhUnder05-a.fhUnder05,metrics:r=>[['1H U0.5',pct(r.fhUnder05)],['1H O0.5',pct(r.fhOver05)],['Sample',r.games]]},
    fhover05:{label:'1H Over 0.5',title:'First-half Over 0.5 teams',copy:'At least one first-half goal in 70%+ of venue matches.',filter:r=>r.fhOver05!==null&&r.fhOver05>=.70,sort:(a,b)=>b.fhOver05-a.fhOver05,metrics:r=>[['1H O0.5',pct(r.fhOver05)],['1H U1.5',pct(r.fhUnder15)],['Sample',r.games]]},
    fhunder15:{label:'1H Under 1.5',title:'First-half Under 1.5 teams',copy:'Zero or one first-half goal in 75%+ of venue matches.',filter:r=>r.fhUnder15!==null&&r.fhUnder15>=.75,sort:(a,b)=>b.fhUnder15-a.fhUnder15,metrics:r=>[['1H U1.5',pct(r.fhUnder15)],['1H O0.5',pct(r.fhOver05)],['Sample',r.games]]},
    fhover15:{label:'1H Over 1.5',title:'First-half Over 1.5 teams',copy:'Two or more first-half goals in at least 35% of venue matches.',filter:r=>r.fhOver15!==null&&r.fhOver15>=.35,sort:(a,b)=>b.fhOver15-a.fhOver15,metrics:r=>[['1H O1.5',pct(r.fhOver15)],['1H O0.5',pct(r.fhOver05)],['Sample',r.games]]},
    shunder05:{label:'2H Under 0.5',title:'Second-half Under 0.5 teams',copy:'Shown only when the feed supplies a direct team-specific second-half rate.',filter:r=>r.shUnder05!==null&&r.shUnder05>=.35,sort:(a,b)=>b.shUnder05-a.shUnder05,metrics:r=>[['2H U0.5',pct(r.shUnder05)],['2H O0.5',pct(r.shOver05)],['Sample',r.games]]},
    shover05:{label:'2H Over 0.5',title:'Second-half Over 0.5 teams',copy:'Shown only when the feed supplies a direct team-specific second-half rate.',filter:r=>r.shOver05!==null&&r.shOver05>=.75,sort:(a,b)=>b.shOver05-a.shOver05,metrics:r=>[['2H O0.5',pct(r.shOver05)],['2H U1.5',pct(r.shUnder15)],['Sample',r.games]]},
    shunder15:{label:'2H Under 1.5',title:'Second-half Under 1.5 teams',copy:'Shown only when the feed supplies a direct team-specific second-half rate.',filter:r=>r.shUnder15!==null&&r.shUnder15>=.70,sort:(a,b)=>b.shUnder15-a.shUnder15,metrics:r=>[['2H U1.5',pct(r.shUnder15)],['2H O0.5',pct(r.shOver05)],['Sample',r.games]]},
    shover15:{label:'2H Over 1.5',title:'Second-half Over 1.5 teams',copy:'Shown only when the feed supplies a direct team-specific second-half rate.',filter:r=>r.shOver15!==null&&r.shOver15>=.40,sort:(a,b)=>b.shOver15-a.shOver15,metrics:r=>[['2H O1.5',pct(r.shOver15)],['2H O0.5',pct(r.shOver05)],['Sample',r.games]]},
    fhgg:{label:'GG 1st Half',title:'Both teams score in first half',copy:'Team-specific first-half BTTS rate of at least 25%.',filter:r=>r.fhBtts!==null&&r.fhBtts>=.25,sort:(a,b)=>b.fhBtts-a.fhBtts,metrics:r=>[['1H GG',pct(r.fhBtts)],['1H NG',pct(r.fhNoBtts)],['Sample',r.games]]},
    fhng:{label:'NG 1st Half',title:'First-half BTTS No teams',copy:'Team-specific first-half BTTS No rate of at least 75%.',filter:r=>r.fhNoBtts!==null&&r.fhNoBtts>=.75,sort:(a,b)=>b.fhNoBtts-a.fhNoBtts,metrics:r=>[['1H NG',pct(r.fhNoBtts)],['1H GG',pct(r.fhBtts)],['Sample',r.games]]},
    shgg:{label:'GG 2nd Half',title:'Both teams score in second half',copy:'Shown only when the feed supplies a direct team-specific second-half BTTS rate.',filter:r=>r.shBtts!==null&&r.shBtts>=.30,sort:(a,b)=>b.shBtts-a.shBtts,metrics:r=>[['2H GG',pct(r.shBtts)],['2H NG',pct(r.shNoBtts)],['Sample',r.games]]},
    shng:{label:'NG 2nd Half',title:'Second-half BTTS No teams',copy:'Shown only when the feed supplies a direct team-specific second-half BTTS rate.',filter:r=>r.shNoBtts!==null&&r.shNoBtts>=.70,sort:(a,b)=>b.shNoBtts-a.shNoBtts,metrics:r=>[['2H NG',pct(r.shNoBtts)],['2H GG',pct(r.shBtts)],['Sample',r.games]]},
    htft11:{label:'HT 1 - FT 1',title:'Lead and win teams',copy:'Team leads at half-time and wins at full-time in at least 25% of its sample.',filter:r=>r.htft11!==null&&r.htft11>=.25,sort:(a,b)=>b.htft11-a.htft11,metrics:r=>[['HT1-FT1',pct(r.htft11)],['1H wins',pct(r.htWin)],['FT wins',pct(r.win)]]},
    htft22:{label:'HT 2 - FT 2',title:'Behind and lose teams',copy:'Team trails at half-time and loses at full-time in at least 25% of its sample.',filter:r=>r.htft22!==null&&r.htft22>=.25,sort:(a,b)=>b.htft22-a.htft22,metrics:r=>[['HT2-FT2',pct(r.htft22)],['1H defeats',pct(r.htLoss)],['FT losses',pct(r.loss)]]},
    gg:{label:'GG',title:'Both teams to score profiles',copy:'Direct venue BTTS rate 65%+, scoring 70%+ and conceding 65%+.',filter:r=>r.btts!==null&&r.btts>=.65&&(r.scored??0)>=.70&&(r.conceded??0)>=.65,sort:(a,b)=>b.btts-a.btts,metrics:r=>[['GG rate',pct(r.btts)],['Scoring',pct(r.scored)],['Conceding',pct(r.conceded)]]},
    ng:{label:'NG',title:'BTTS No profiles',copy:'Direct venue BTTS No rate of at least 65%.',filter:r=>r.noBtts!==null&&r.noBtts>=.65,sort:(a,b)=>b.noBtts-a.noBtts,metrics:r=>[['NG rate',pct(r.noBtts)],['Clean sheets',pct(r.cs)],['FTS',pct(r.fts)]]}
  };

  const rankingRules={
    edge:{
      best:{title:'Best Team Edges',copy:'PPG 2.20+, scores 2.00+, top four, unbeaten profile and odds 1.55 or shorter.',filter:r=>r.ppg>=2.20&&r.gf>=2&&top4(r)&&r.odds!==null&&r.odds<=1.55&&(r.noLoss>=5||(r.unbeaten||0)>=.80),sort:(a,b)=>b.ppg-a.ppg||b.gf-a.gf,reasons:r=>[`PPG ${fmt(r.ppg)} ≥ 2.20`,`Scores ${fmt(r.gf)} ≥ 2.00`,`Top ${r.position}`,`Odds ${fmt(r.odds)} ≤ 1.55`,r.noLoss>=5?`${r.noLoss} unbeaten`:`${pct(r.unbeaten)} unbeaten`]},
      worst:{title:'Worst Team Edges',copy:'PPG 0.80 or lower, scores 0.80 or less, bottom four, winless profile and odds 4.50 or bigger.',filter:r=>r.ppg<=.80&&r.gf<=.80&&bottom4(r)&&r.odds!==null&&r.odds>=4.50&&(r.noWin>=5||(r.win??1)<=.20),sort:(a,b)=>a.ppg-b.ppg||a.gf-b.gf,reasons:r=>[`PPG ${fmt(r.ppg)} ≤ 0.80`,`Scores ${fmt(r.gf)} ≤ 0.80`,`Bottom ${r.tableSize-r.position+1}`,`Odds ${fmt(r.odds)} ≥ 4.50`,r.noWin>=5?`${r.noWin} winless`:`${pct(r.win)} win rate`]},
      attackBest:{title:'Best Offensive Edges',copy:'Reliable venue samples with 2.00+ scoring and failed-to-score no higher than 20%.',filter:r=>r.gf>=2&&r.fts!==null&&r.fts<=.20,sort:(a,b)=>b.gf-a.gf||b.ppg-a.ppg,reasons:r=>[`Scores ${fmt(r.gf)}`,`FTS ${pct(r.fts)}`,`Sample ${r.games}`]},
      attackWorst:{title:'Worst Offensive Edges',copy:'Reliable venue samples with 0.80 or lower scoring and failed-to-score at least 40%.',filter:r=>r.gf<=.80&&r.fts!==null&&r.fts>=.40,sort:(a,b)=>a.gf-b.gf||b.fts-a.fts,reasons:r=>[`Scores ${fmt(r.gf)}`,`FTS ${pct(r.fts)}`,`Sample ${r.games}`]},
      defenceBest:{title:'Best Defensive Edges',copy:'Concedes no more than 0.80 with a clean-sheet rate of at least 40%.',filter:r=>r.ga<=.80&&r.cs!==null&&r.cs>=.40,sort:(a,b)=>a.ga-b.ga||b.cs-a.cs,reasons:r=>[`Concedes ${fmt(r.ga)}`,`Clean sheets ${pct(r.cs)}`,`Sample ${r.games}`]},
      defenceWorst:{title:'Worst Defensive Edges',copy:'Concedes at least 2.00 and keeps clean sheets in under 20%.',filter:r=>r.ga>=2&&r.cs!==null&&r.cs<.20,sort:(a,b)=>b.ga-a.ga||a.cs-b.cs,reasons:r=>[`Concedes ${fmt(r.ga)}`,`Clean sheets ${pct(r.cs)}`,`Sample ${r.games}`]}
    },season:{}
  };
  rankingRules.season.best={...rankingRules.edge.best,title:'Season Power — Best',copy:'Strong venue power independent of the next-match price.',filter:r=>r.ppg>=2&&r.gf>=1.70&&top4(r)};
  rankingRules.season.worst={...rankingRules.edge.worst,title:'Season Power — Worst',copy:'Weak venue power independent of the next-match price.',filter:r=>r.ppg<=1&&r.gf<=1&&bottom4(r)};
  rankingRules.season.attackBest={...rankingRules.edge.attackBest,title:'Season Attack — Best'};
  rankingRules.season.attackWorst={...rankingRules.edge.attackWorst,title:'Season Attack — Worst'};
  rankingRules.season.defenceBest={...rankingRules.edge.defenceBest,title:'Season Defence — Best'};
  rankingRules.season.defenceWorst={...rankingRules.edge.defenceWorst,title:'Season Defence — Worst'};

  const params=new URLSearchParams(location.search);
  let mode=['rankings','trends','lab','auto'].includes(params.get('mode'))?params.get('mode'):'rankings';
  let view=['edge','season'].includes(params.get('view'))?params.get('view'):'edge';
  let category=['best','worst','attack','defence'].includes(params.get('category'))?params.get('category'):'best';
  let polarity=['Best','Worst'].includes(params.get('polarity'))?params.get('polarity'):'Best';
  let trend=trends[params.get('trend')]?params.get('trend'):'unbeaten';
  let rankQuery='',rankLeague='all',trendQuery='',trendLeague='all',autoQuery='',autoLeague='all',autoMarket='all',autoView='core';
  let autoRegistry=new Map();
  const autoCache=new Map();
  const AUTO_MODEL_VERSION=Gate.MODEL_VERSION;
  const learningGuard=window.P2U_AUTO_LEARNING_GUARD_V271||{fixtures:{}};
  const fixtureKey=m=>m&&m.id!=null?`f${m.id}`:`${m&&m.home||''}|${m&&m.away||''}|${dateOf(m)}`;
  function learningDecision(m){const e=learningGuard.fixtures&&learningGuard.fixtures[fixtureKey(m)]||null;if(!e)return{state:'monitor',delta:0};const state=e.s==='b'?'block':e.s==='w'?'watch':e.s==='p'?'boost':'stable';return{state,delta:Number(e.d)||0};}
  const rankKey=()=>category==='attack'?`attack${polarity}`:category==='defence'?`defence${polarity}`:category;
  const allProfiles=latestProfiles(fixturePool);
  const activeProfiles=()=>latestProfiles(selectedFixturePool());

  function setOptions(select,values,current='all'){
    if(!select)return;
    select.innerHTML='<option value="all">All leagues</option>'+values.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
    select.value=values.includes(current)?current:'all';
  }
  function friendlyDate(d){
    if(!validDate(d))return 'All loaded dates';
    const label=new Intl.DateTimeFormat(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${d}T00:00:00Z`));
    return d===today?`Today · ${label}`:label;
  }
  function dateMatchCount(d){return fixturePool.filter(m=>dateOf(m)===d).length;}
  function populateDateFilter(){
    const select=$('team-date-filter');if(!select)return;
    select.innerHTML='<option value="all">All loaded dates</option>'+availableDates.map(d=>`<option value="${d}">${esc(friendlyDate(d))} · ${dateMatchCount(d)} match${dateMatchCount(d)===1?'':'es'}</option>`).join('');
    select.value=selectedDate;
  }
  function updateDateSummary(){
    const pool=selectedFixturePool(),summary=$('team-date-summary');
    if(summary)summary.textContent=selectedDate==='all'?`All loaded dates · ${pool.length} matches`:`${friendlyDate(selectedDate)} · ${pool.length} matches`;
    const windowCopy=$('team-rank-window');
    if(!windowCopy)return;
    if(selectedDate!=='all')windowCopy.textContent=`Fixture date: ${friendlyDate(selectedDate)} · ${pool.length} loaded match${pool.length===1?'':'es'}`;
    else windowCopy.textContent=currentPool.length?`Current fixture window: ${today} to ${windowEnd} · ${currentPool.length} loaded matches`:`Latest loaded unresolved fixtures shown · data source updated ${window.P2U_DATA_META&&window.P2U_DATA_META.sourceUpdatedAt?new Date(window.P2U_DATA_META.sourceUpdatedAt).toLocaleString():'unknown'}`;
  }
  function refreshLeagueFilters(){
    const leagues=[...new Set(activeProfiles().map(r=>r.league))].sort();
    setOptions($('team-rank-league'),leagues,rankLeague);rankLeague=$('team-rank-league')?$('team-rank-league').value:'all';
    setOptions($('team-trend-league'),leagues,trendLeague);trendLeague=$('team-trend-league')?$('team-trend-league').value:'all';
    setOptions($('team-auto-league'),leagues,autoLeague);autoLeague=$('team-auto-league')?$('team-auto-league').value:'all';
  }
  function setSelectedDate(value){
    selectedDate=validDate(value)&&availableDates.includes(value)?value:'all';
    const url=new URL(location.href);if(selectedDate==='all')url.searchParams.delete('date');else url.searchParams.set('date',selectedDate);history.replaceState(null,'',url);
    refreshLeagueFilters();updateDateSummary();renderRankings();renderTrends();populateLabMatches();renderAutoPicks();
  }
  function rankCard(r,cfg){
    const reason=cfg.reasons(r).map(x=>`<li>${esc(x)}</li>`).join('');
    return `<article class="p2u-team-rank-card"><div class="p2u-team-rank-number">${r.position&&r.tableSize?`${r.position}/${r.tableSize}`:'—'}</div><div class="p2u-team-rank-head">${r.logo?`<img src="${esc(r.logo)}" alt="" loading="lazy">`:''}<div><h3>${esc(r.team)}</h3><p>${esc(r.league)}${r.country?` · ${esc(r.country)}`:''}</p></div></div><div class="p2u-team-rank-metrics"><span><b>${fmt(r.ppg)}</b><small>PPG</small></span><span><b>${fmt(r.gf)}</b><small>Scores</small></span><span><b>${fmt(r.ga)}</b><small>Concedes</small></span><span><b>${pct(r.cs)}</b><small>Clean sheets</small></span><span><b>${r.games}</b><small>Venue sample</small></span><span><b>${r.odds?fmt(r.odds):'—'}</b><small>Next odds</small></span></div><ul class="p2u-team-rank-reasons">${reason}</ul><div class="p2u-team-rank-footer"><span>${esc(r.matchDate||'')}</span><span>${r.side==='home'?'Home':'Away'} vs ${esc(r.opponent||'TBD')}</span></div></article>`;
  }
  function trendCard(r,cfg){
    const metrics=cfg.metrics(r).map(([label,value])=>`<span><b>${esc(value)}</b><small>${esc(label)}</small></span>`).join('');
    return `<article class="p2u-team-rank-card p2u-team-trend-card"><div class="p2u-team-rank-number">${r.side==='home'?'H':'A'}</div><div class="p2u-team-rank-head">${r.logo?`<img src="${esc(r.logo)}" alt="" loading="lazy">`:''}<div><h3>${esc(r.team)}</h3><p>${esc(r.league)} · ${r.side==='home'?'Home split':'Away split'}</p></div></div><div class="p2u-team-rank-metrics">${metrics}<span><b>${r.games}</b><small>Sample</small></span><span><b>${fmt(r.gf)}</b><small>Scores</small></span><span><b>${fmt(r.ga)}</b><small>Concedes</small></span></div><div class="p2u-team-rank-footer"><span>${esc(r.matchDate||'')}</span><span>vs ${esc(r.opponent||'TBD')}</span></div></article>`;
  }

  function renderRankings(){
    const cfg=rankingRules[view][rankKey()];
    let rows=activeProfiles().filter(cfg.filter);
    if(rankLeague!=='all')rows=rows.filter(r=>r.league===rankLeague);
    if(rankQuery)rows=rows.filter(r=>`${r.team} ${r.league} ${r.country}`.toLowerCase().includes(rankQuery));
    rows.sort((a,b)=>String(a.league).localeCompare(String(b.league))||cfg.sort(a,b));
    $('team-rank-title').textContent=cfg.title;$('team-rank-copy').textContent=cfg.copy;$('team-rank-count').textContent=`${rows.length} qualified · sample ${MIN_SAMPLE}+`;
    $('team-rank-grid').innerHTML=rows.length?rows.slice(0,100).map(r=>rankCard(r,cfg)).join(''):'<div class="p2u-team-rank-empty">No teams pass every threshold in the loaded fixture set. That is a valid no-qualification result.</div>';
    document.querySelectorAll('[data-rank-view]').forEach(b=>b.classList.toggle('is-active',b.dataset.rankView===view));
    document.querySelectorAll('[data-rank-category]').forEach(b=>b.classList.toggle('is-active',b.dataset.rankCategory===category));
    (document.querySelector('.p2u-team-polarity-cluster')||document.querySelector('.p2u-team-rank-polarity')).hidden=!['attack','defence'].includes(category);
    document.querySelectorAll('[data-rank-polarity]').forEach(b=>b.classList.toggle('is-active',b.dataset.rankPolarity===polarity));
  }
  function renderTrends(){
    const cfg=trends[trend];let rows=activeProfiles().filter(cfg.filter);
    if(trendLeague!=='all')rows=rows.filter(r=>r.league===trendLeague);
    if(trendQuery)rows=rows.filter(r=>`${r.team} ${r.league} ${r.country}`.toLowerCase().includes(trendQuery));
    rows.sort((a,b)=>String(a.league).localeCompare(String(b.league))||cfg.sort(a,b));
    $('team-trend-title').textContent=cfg.title;$('team-trend-copy').textContent=cfg.copy;$('team-trend-count').textContent=`${rows.length} qualified · split sample ${MIN_SAMPLE}+`;
    $('team-trend-grid').innerHTML=rows.length?rows.slice(0,120).map(r=>trendCard(r,cfg)).join(''):'<div class="p2u-team-rank-empty">No teams pass this trend threshold in the loaded fixture set.</div>';
    document.querySelectorAll('[data-trend]').forEach(b=>b.classList.toggle('is-active',b.dataset.trend===trend));
  }

  function traitPass(row,key){const cfg=trends[key];return !!(cfg&&row&&row.games>=MIN_SAMPLE&&cfg.filter(row));}
  function labMatches(){
    const homeTrait=$('lab-home-trait').value,awayTrait=$('lab-away-trait').value;
    return selectedFixturePool().map(m=>({m,home:sideRow(m,'home'),away:sideRow(m,'away')})).filter(x=>traitPass(x.home,homeTrait)&&traitPass(x.away,awayTrait));
  }
  function populateLabMatches(){
    const rows=labMatches(),homeSelect=$('lab-home-team'),awaySelect=$('lab-away-team');
    homeSelect.innerHTML=rows.length?rows.map(x=>`<option value="${esc(String(x.m.id))}">${esc(x.home.team)} · ${esc(x.m.league)} · ${esc(x.m.matchDate||'')}</option>`).join(''):'<option value="">No loaded match qualifies</option>';
    homeSelect.disabled=!rows.length;$('lab-analyse').disabled=!rows.length;
    const selected=rows.find(x=>String(x.m.id)===homeSelect.value)||rows[0];
    awaySelect.innerHTML=selected?`<option>${esc(selected.away.team)}</option>`:'<option>—</option>';
    $('lab-match-count').textContent=rows.length?`${rows.length} loaded fixture${rows.length===1?'':'s'} match both selected profiles.`:'No loaded fixture currently matches both profiles. Try another combination.';
    if(rows.length)renderLabPlaceholder(selected);else $('lab-result').innerHTML='<div class="p2u-team-rank-empty">No qualifying fixture is available for this profile combination.</div>';
  }
  function oddsValue(m,key){return first(m&&m.odds&&m.odds[key]);}
  function leagueRate(m,key){return rate(m&&m.leagueTrends&&m.leagueTrends.rates&&m.leagueTrends.rates[key]);}
  function average(values){const xs=values.filter(v=>v!==null&&Number.isFinite(v));return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;}
  function analyseMatch(m,homeTrait,awayTrait,options={}){
    const h=sideRow(m,'home'),a=sideRow(m,'away');
    const candidates=[];const projection=((h.gf??1.2)+(a.ga??1.2))/2+((a.gf??1.1)+(h.ga??1.1))/2;
    const sample=Math.min(h.games||0,a.games||0),sampleScore=clamp((sample-6)*2,0,10);
    const addCandidate=(id,market,canonical,score,oddsKey,reasons,checks=[])=>{
      const odds=oddsValue(m,oddsKey);if(odds===null||checks.some(Boolean))return;
      candidates.push({id,market,canonical,score:clamp(score+sampleScore),odds,reasons,oddsKey});
    };
    const addSignal=(id,score,reasons=[])=>candidates.push({id,market:id,canonical:id,score:clamp(score),odds:null,reasons,publishable:false});
    const ppgEdge=(h.ppg??1.2)-(a.ppg??1.2),awayEdge=(a.ppg??1.2)-(h.ppg??1.2);
    addCandidate('HOME_WIN',`${h.team} to win`,'Home Win',64+ppgEdge*12+((h.win??.35)-(a.win??.35))*24+((a.loss??.35)-(h.loss??.35))*12,'home',[`Home split PPG edge ${fmt(ppgEdge)}`,`Home win rate ${pct(h.win)}`,`Away loss rate ${pct(a.loss)}`],[ppgEdge<.55,(h.win??0)<.45,(a.unbeaten??0)>.72,oddsValue(m,'home')>2.20]);
    addCandidate('AWAY_WIN',`${a.team} to win`,'Away Win',64+awayEdge*12+((a.win??.35)-(h.win??.35))*24+((h.loss??.35)-(a.loss??.35))*12,'away',[`Away split PPG edge ${fmt(awayEdge)}`,`Away win rate ${pct(a.win)}`,`Home loss rate ${pct(h.loss)}`],[awayEdge<.55,(a.win??0)<.45,(h.unbeaten??0)>.72,oddsValue(m,'away')>2.20]);
    addCandidate('DC1X',`${h.team} or Draw`,'Double Chance 1X',70+((h.unbeaten??.5)-.65)*40+(.30-(a.win??.3))*25,'dc1x',[`Home unbeaten ${pct(h.unbeaten)}`,`Away win rate ${pct(a.win)}`],[(h.unbeaten??0)<.70,(a.win??1)>.32,oddsValue(m,'dc1x')>1.55]);
    addCandidate('DCX2',`Draw or ${a.team}`,'Double Chance X2',70+((a.unbeaten??.5)-.65)*40+(.30-(h.win??.3))*25,'dcx2',[`Away unbeaten ${pct(a.unbeaten)}`,`Home win rate ${pct(h.win)}`],[(a.unbeaten??0)<.70,(h.win??1)>.32,oddsValue(m,'dcx2')>1.55]);
    const o15=average([h.over15,a.over15,leagueRate(m,'Over 1.5')]);
    const o25=average([h.over25,a.over25,leagueRate(m,'Over 2.5')]);
    const o35=average([h.over35,a.over35,leagueRate(m,'Over 3.5')]);
    const u15=o15===null?null:1-o15,u25=o25===null?null:1-o25,u35=o35===null?null:1-o35;
    addCandidate('OVER15','Over 1.5 Goals','Over 1.5 Goals',(o15??0)*86+Math.min(10,Math.max(0,projection-2.2)*8),'over15',[`Combined Over 1.5 profile ${pct(o15)}`,`Projected total ${fmt(projection)}`,`League Over 1.5 ${pct(leagueRate(m,'Over 1.5'))}`],[(o15??0)<.78,projection<2.25]);
    addCandidate('UNDER15','Under 1.5 Goals','Under 1.5 Goals',(u15??0)*90+Math.min(8,Math.max(0,1.8-projection)*10),'under15',[`Combined Under 1.5 profile ${pct(u15)}`,`Projected total ${fmt(projection)}`],[(u15??0)<.58,projection>1.85]);
    addCandidate('OVER25','Over 2.5 Goals','Over 2.5 Goals',(o25??0)*90+Math.min(8,Math.max(0,projection-2.7)*8),'over25',[`Combined Over 2.5 profile ${pct(o25)}`,`Projected total ${fmt(projection)}`,`League Over 2.5 ${pct(leagueRate(m,'Over 2.5'))}`],[(o25??0)<.65,projection<2.65]);
    addCandidate('UNDER25','Under 2.5 Goals','Under 2.5 Goals',(u25??0)*90+Math.min(8,Math.max(0,2.45-projection)*8),'under25',[`Combined Under 2.5 profile ${pct(u25)}`,`Projected total ${fmt(projection)}`],[(u25??0)<.65,projection>2.50]);
    addCandidate('OVER35','Over 3.5 Goals','Over 3.5 Goals',(o35??0)*92+Math.min(8,Math.max(0,projection-3.3)*7),'over35',[`Combined Over 3.5 profile ${pct(o35)}`,`Projected total ${fmt(projection)}`],[(o35??0)<.52,projection<3.20]);
    addCandidate('UNDER35','Under 3.5 Goals','Under 3.5 Goals',(u35??0)*88+Math.min(9,Math.max(0,3.15-projection)*7),'under35',[`Combined Under 3.5 profile ${pct(u35)}`,`Projected total ${fmt(projection)}`,`League Under 3.5 ${pct(leagueRate(m,'Under 3.5'))}`],[(u35??0)<.76,projection>3.20]);
    const gg=average([h.btts,a.btts,leagueRate(m,'BTTS Yes')]);
    addCandidate('BTTS_YES','Both Teams to Score — Yes','BTTS Yes',(gg??0)*88+(average([h.scored,a.scored,h.conceded,a.conceded])??0)*10,'bttsYes',[`Direct split GG profile ${pct(gg)}`,`${h.team} scoring ${pct(h.scored)}`,`${a.team} scoring ${pct(a.scored)}`],[(gg??0)<.65,(h.scored??0)<.70,(a.scored??0)<.70,(h.conceded??0)<.65,(a.conceded??0)<.65]);
    const ng=average([h.noBtts,a.noBtts,leagueRate(m,'BTTS No')]);
    addCandidate('BTTS_NO','Both Teams to Score — No','BTTS No',(ng??0)*90+Math.max(h.fts??0,a.fts??0)*8,'bttsNo',[`Direct split NG profile ${pct(ng)}`,`Highest failed-to-score rate ${pct(Math.max(h.fts??0,a.fts??0))}`,`Best clean-sheet rate ${pct(Math.max(h.cs??0,a.cs??0))}`],[(ng??0)<.64]);
    const fhO05=average([h.fhOver05,a.fhOver05]),fhU15=average([h.fhUnder15,a.fhUnder15]);
    addCandidate('FH_OVER05','First Half Over 0.5 Goals','First Half Over 0.5',(fhO05??0)*90+Math.min(8,((h.fhOver05??0)+(a.fhOver05??0))*4),'fhOver05',[`Home 1H Over 0.5 ${pct(h.fhOver05)}`,`Away 1H Over 0.5 ${pct(a.fhOver05)}`,`Combined first-half profile ${pct(fhO05)}`],[(fhO05??0)<.70,(h.fhOver05??0)<.65,(a.fhOver05??0)<.65]);
    addCandidate('FH_UNDER15','First Half Under 1.5 Goals','First Half Under 1.5',(fhU15??0)*90+Math.min(8,((h.fhUnder15??0)+(a.fhUnder15??0))*4),'fhUnder15',[`Home 1H Under 1.5 ${pct(h.fhUnder15)}`,`Away 1H Under 1.5 ${pct(a.fhUnder15)}`,`Combined first-half profile ${pct(fhU15)}`],[(fhU15??0)<.75,(h.fhUnder15??0)<.70,(a.fhUnder15??0)<.70]);
    const noDrawStrength=average([h.draw===null?null:1-h.draw,a.draw===null?null:1-a.draw,leagueRate(m,'Draw')===null?null:1-leagueRate(m,'Draw')]);
    addCandidate('NO_DRAW','No Draw — 12','Double Chance 12',(noDrawStrength??0)*88+Math.min(10,(h.noDraw+a.noDraw)*1.2),'dc12',[`Home no-draw run ${h.noDraw}`,`Away no-draw run ${a.noDraw}`,`Combined no-draw profile ${pct(noDrawStrength)}`],[(h.draw??1)>.22,(a.draw??1)>.22,h.noDraw+a.noDraw<6]);
    const drawPressure=average([h.draw,a.draw,leagueRate(m,'Draw')]);
    addSignal('DRAW_PRESSURE',(drawPressure??0)*100+Math.max(0,10-(h.noDraw+a.noDraw)),[`Combined draw pressure ${pct(drawPressure)}`]);
    candidates.sort((x,y)=>y.score-x.score);
    const decision=Gate.select({m,h,a,homeTrait,awayTrait,candidates,meta:window.P2U_DATA_META||{},today,automatic:!!options.automatic});
    const primary=decision.primary;
    const supporting=primary?(decision.evaluated||[]).filter(c=>c.id!==primary.id&&Math.abs(c.grade-primary.grade)<=8).slice(0,2):[];
    const warnings=[...(decision.warnings||[])];
    if(usingFallback&&!options.automatic)warnings.push('This manual analysis uses the latest unresolved fixture because no current fixture is loaded.');
    if(primary&&primary.valueNote)warnings.push(primary.valueNote);
    return {h,a,projection,candidates,primary,supporting,warnings,sample,homeTrait,awayTrait,route:decision.route,quality:decision.quality,rejected:decision.rejected};
  }
  function renderLabPlaceholder(selected){
    $('lab-result').innerHTML=`<div class="p2u-lab-preview"><strong>${esc(selected.home.team)} vs ${esc(selected.away.team)}</strong><span>${esc(selected.m.league)} · ${esc(selected.m.matchDate||'')}</span><small>Tap Analyse matchup to generate the safest qualifying market.</small></div>`;
  }
  function renderAnalysis(m){
    const homeTrait=$('lab-home-trait').value,awayTrait=$('lab-away-trait').value,result=analyseMatch(m,homeTrait,awayTrait),{h,a,primary,supporting,warnings}=result;
    const profileBox=(r,trait)=>`<article><span>${r.side==='home'?'HOME PROFILE':'AWAY PROFILE'}</span><h3>${esc(r.team)}</h3><b>${esc(trends[trait].label)}</b><div><small>PPG <strong>${fmt(r.ppg)}</strong></small><small>W/D/L <strong>${pct(r.win)} / ${pct(r.draw)} / ${pct(r.loss)}</strong></small><small>GF/GA <strong>${fmt(r.gf)} / ${fmt(r.ga)}</strong></small><small>Sample <strong>${r.games}</strong></small></div></article>`;
    const primaryHtml=primary?`<div class="p2u-lab-pick"><span>SAFEST QUALIFYING PICK</span><h2>${esc(primary.market)}</h2><div class="p2u-lab-pick-meta"><b>Grade ${Math.round(primary.score)}/100</b><b>Odds ${fmt(primary.odds)}</b></div><ul>${primary.reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:`<div class="p2u-lab-no-bet"><span>STRICT RESULT</span><h2>No Bet</h2><p>No market cleared the minimum evidence, price and contradiction checks. The Lab will not force a selection.</p></div>`;
    const supportHtml=supporting.length?`<div class="p2u-lab-support"><h3>Supporting markets</h3>${supporting.map(c=>`<div><b>${esc(c.market)}</b><span>Grade ${Math.round(c.score)}/100 · ${fmt(c.odds)}</span></div>`).join('')}</div>`:'';
    const warnHtml=warnings.length?`<div class="p2u-lab-warnings"><strong>Data notes</strong>${warnings.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:'';
    $('lab-result').innerHTML=`<div class="p2u-lab-result-head"><div><span>${esc(m.league||'')}</span><h2>${esc(h.team)} <i>vs</i> ${esc(a.team)}</h2><p>${esc(m.matchDate||'')} · projected total ${fmt(result.projection)}</p></div></div><div class="p2u-lab-profiles">${profileBox(h,homeTrait)}${profileBox(a,awayTrait)}</div>${primaryHtml}${supportHtml}${warnHtml}<p class="p2u-lab-disclaimer">This is a statistical match classification, not a guarantee. It only uses the currently loaded split data and odds.</p>`;
  }
  function analyseSelected(){const rows=labMatches(),selected=rows.find(x=>String(x.m.id)===$('lab-home-team').value);if(selected)renderAnalysis(selected.m);}

  function traitStrength(r,key){
    if(!r)return 0;
    const values={
      wins:(r.win??0)*82+Math.min(18,Math.max(0,(r.ppg??0)-1.5)*18),losses:(r.loss??0)*82+Math.min(18,Math.max(0,1.2-(r.ppg??1.2))*18),
      winless:Math.max(Math.min(100,(r.noWin||0)*10),r.win===null?0:(1-r.win)*100),unbeaten:Math.max(Math.min(100,(r.noLoss||0)*10),(r.unbeaten??0)*100),
      draws:(r.draw??0)*100,nodraws:Math.max(Math.min(100,(r.noDraw||0)*10),r.draw===null?0:(1-r.draw)*100),over15:(r.over15??0)*100,under15:(r.under15??0)*100,
      over25:(r.over25??0)*100,under25:(r.under25??0)*100,over35:(r.over35??0)*100,under35:(r.under35??0)*100,gg:(r.btts??0)*100,ng:(r.noBtts??0)*100
    };
    return clamp(values[key]||0);
  }
  function qualifyingTraits(r){return Object.keys(trends).filter(key=>traitPass(r,key)).sort((a,b)=>traitStrength(r,b)-traitStrength(r,a));}
  function marketFamily(market){
    const x=String(market||'');if(x==='No Draw — 12')return'nodraw';if(x.includes('Both Teams to Score'))return'btts';if(x.includes('Over ')||x.includes('Under '))return'goals';if(x.includes('or Draw'))return'double';if(x.includes('to win'))return'result';return'other';
  }
  function approvedPairs(h,a){
    const bestByRoute=new Map(),homeTraits=qualifyingTraits(h).slice(0,5),awayTraits=qualifyingTraits(a).slice(0,5);
    for(const ht of homeTraits)for(const at of awayTraits){
      const route=Gate.approvedRoute(ht,at);if(!route)continue;
      const pairStrength=(traitStrength(h,ht)+traitStrength(a,at))/2;
      const old=bestByRoute.get(route.id);if(!old||pairStrength>old.pairStrength)bestByRoute.set(route.id,{ht,at,route,pairStrength});
    }
    return [...bestByRoute.values()].sort((x,y)=>y.pairStrength-x.pairStrength);
  }
  function autoSelectionFor(m){
    const h=sideRow(m,'home'),a=sideRow(m,'away');if((h.games||0)<MIN_SAMPLE||(a.games||0)<MIN_SAMPLE)return null;
    const pairs=approvedPairs(h,a);if(!pairs.length)return null;
    let best=null;
    for(const pair of pairs){
      const result=analyseMatch(m,pair.ht,pair.at,{automatic:true}),base=result.primary;if(!base)continue;
      const learning=learningDecision(m);if(learning.state==='block')continue;
      const primary={...base,reasons:[...(base.reasons||[])]};primary.score=clamp(primary.score+learning.delta);primary.grade=primary.score;
      if(primary.score<(primary.rule&&primary.rule.minGrade||84))continue;
      const rank=primary.score+pair.pairStrength*.035+(result.quality&&result.quality.grade||0)*.025+Math.min(4,primary.margin*.2);
      const row={m,h,a,homeTrait:pair.ht,awayTrait:pair.at,primary,supporting:result.supporting,warnings:result.warnings,projection:result.projection,sample:result.sample,margin:primary.margin,pairStrength:pair.pairStrength,rank,routeId:pair.route.id,quality:result.quality,learningState:learning.state,modelVersion:AUTO_MODEL_VERSION};
      if(!best||row.rank>best.rank)best=row;
    }
    return best;
  }
  function automaticSelections(){
    const cacheKey=`auto|${selectedDate}|${AUTO_MODEL_VERSION}`;if(autoCache.has(cacheKey))return autoCache.get(cacheKey);
    const rows=autoFixturePool().map(autoSelectionFor).filter(Boolean),unique=new Map();
    for(const row of rows){const key=fixtureKey(row.m),old=unique.get(key);if(!old||row.rank>old.rank)unique.set(key,row);}
    const result=[...unique.values()].sort((a,b)=>String(dateOf(a.m)).localeCompare(String(dateOf(b.m)))||b.primary.score-a.primary.score);autoCache.set(cacheKey,result);return result;
  }
  function dailyCoreRows(rows){
    const groups=new Map(),out=[];for(const row of rows){const d=dateOf(row.m);if(!groups.has(d))groups.set(d,[]);groups.get(d).push(row);}for(const list of groups.values())out.push(...Gate.buildDailyCore(list,4));return out;
  }
  function slipMarket(row){return row&&row.primary&&row.primary.settleMarket||row&&row.primary&&row.primary.canonical||row&&row.primary&&row.primary.market;}
  function autoPickCard(row,key){
    const {m,h,a,homeTrait,awayTrait,primary,sample}=row,reasons=primary.reasons.slice(0,2).map(x=>`<li>${esc(x)}</li>`).join(''),quality=row.quality&&row.quality.grade||0;
    return `<article class="p2u-auto-pick-card" data-auto-fixture="${esc(fixtureKey(m))}" data-auto-market="${esc(primary.market)}">
      <div class="p2u-auto-pick-top"><div><span>${esc(m.league||'Unknown league')}</span><small>${esc(dateOf(m))}${m.kickoff?` · ${esc(String(m.kickoff).slice(11,16))}`:''}</small></div><div><span class="p2u-auto-learning-pill" data-learning-state="${esc(row.learningState||'monitor')}">Learning tracked</span><b>${Math.round(primary.score)}/100</b></div></div>
      <div class="p2u-auto-teams"><h3>${esc(h.team)} <i>vs</i> ${esc(a.team)}</h3><p>${esc(m.country||'')} · split sample ${sample}+</p></div>
      <div class="p2u-auto-profiles"><span><small>HOME PROFILE</small><b>${esc(trends[homeTrait].label)}</b></span><span><small>AWAY PROFILE</small><b>${esc(trends[awayTrait].label)}</b></span></div>
      <div class="p2u-auto-market"><span>AUTOMATIC PICK</span><h3>${esc(primary.market)}</h3><div><b>Odds ${fmt(primary.odds)}</b><b>Grade ${Math.round(primary.score)}/100</b><b>Data ${Math.round(quality)}/100</b></div></div>
      <ul class="p2u-auto-reasons">${reasons}</ul>
      <div class="p2u-auto-actions"><button type="button" class="p2u-auto-add-slip" data-auto-slip="${esc(key)}">+ Add to Slip</button><button type="button" class="p2u-auto-open-lab" data-auto-open="${esc(key)}">Open analysis</button></div>
    </article>`;
  }
  function settledMarkup(){
    const state=window.P2UAutoLearningV271&&window.P2UAutoLearningV271.state,rows=state&&Array.isArray(state.recent)?state.recent:[];
    if(!rows.length)return'<div class="p2u-team-rank-empty">No verified settled Auto Picks are available yet.</div>';
    return `<section class="p2u-auto-settled-grid">${rows.map(r=>`<article class="is-${String(r.result||'').toLowerCase()}"><div><span>${esc(r.date||'')}</span><b>${esc(r.home)} vs ${esc(r.away)}</b><small>${esc(r.market)}</small></div><strong>${esc(r.result||'')}</strong><em>${esc(r.score||'')}</em></article>`).join('')}</section>`;
  }
  function renderAutoPicks(){
    const raw=automaticSelections(),core=dailyCoreRows(raw);autoRegistry=new Map();raw.forEach((row,i)=>autoRegistry.set(String(i),row));
    let source=autoView==='core'?core:raw;
    let rows=source.filter(row=>{if(autoLeague!=='all'&&row.m.league!==autoLeague)return false;if(autoMarket!=='all'&&marketFamily(row.primary.market)!==autoMarket)return false;if(autoQuery&&!`${row.h.team} ${row.a.team} ${row.m.league} ${row.primary.market}`.toLowerCase().includes(autoQuery))return false;return true;});
    const checked=autoFixturePool().length,noBet=Math.max(0,checked-raw.length);
    $('team-auto-summary').innerHTML=`<span><b>${checked}</b><small>Current fixtures checked</small></span><span><b>${raw.length}</b><small>All qualified</small></span><span><b>${core.length}</b><small>Daily Core</small></span><span><b>${noBet}</b><small>No Bet</small></span>`;
    document.querySelectorAll('[data-auto-view]').forEach(b=>b.classList.toggle('is-active',b.dataset.autoView===autoView));
    const addCore=$('team-auto-add-core');if(addCore){addCore.hidden=autoView!=='core'||!core.length;addCore.disabled=!core.length;addCore.textContent=core.length?`+ Add Core ${core.length} to Slip`:'+ Add Core to Slip';}
    if(autoView==='settled'){$('team-auto-count').textContent='Verified results';$('team-auto-grid').innerHTML=settledMarkup();return;}
    $('team-auto-count').textContent=`${rows.length} selection${rows.length===1?'':'s'}`;
    const groups=new Map();for(const row of rows){const d=dateOf(row.m)||'Unknown date';if(!groups.has(d))groups.set(d,[]);groups.get(d).push(row);}
    let empty='No current fixture cleared the approved profile route, data-quality, price, value and conflict gates.';
    if(autoView==='core'&&raw.length&&core.length===0)empty='Qualified fixtures exist, but fewer than three independent selections passed the Daily Core portfolio gate. Open All Qualified to review them.';
    $('team-auto-grid').innerHTML=rows.length?[...groups.entries()].map(([d,list])=>`<section class="p2u-auto-date-group"><header><div><span>${esc(friendlyDate(d))}</span><small>${list.length} ${autoView==='core'?'core':'qualified'} selection${list.length===1?'':'s'}</small></div></header><div class="p2u-auto-pick-grid">${list.map(row=>{const key=[...autoRegistry.entries()].find(([,v])=>v===row)?.[0]||'';return autoPickCard(row,key);}).join('')}</div></section>`).join(''):`<div class="p2u-team-rank-empty">${esc(empty)}</div>`;
    document.querySelectorAll('[data-auto-open]').forEach(button=>button.onclick=()=>openAutoInLab(button.dataset.autoOpen));
    document.querySelectorAll('[data-auto-slip]').forEach(button=>button.onclick=()=>addAutoToSlip(button.dataset.autoSlip));
    if(window.P2UAutoLearningV271&&typeof window.P2UAutoLearningV271.decorate==='function')window.P2UAutoLearningV271.decorate(raw);
  }
  function addAutoToSlip(key){const row=autoRegistry.get(String(key));if(!row||!window.P2USlip)return;window.P2USlip.add(row.m,slipMarket(row),'Team Intelligence Auto Picks');}
  function addCoreToSlip(){const rows=dailyCoreRows(automaticSelections());if(!rows.length||!window.P2USlip)return;window.P2USlip.addMany(rows.map(row=>({m:row.m,market:slipMarket(row),engine:'Team Intelligence Daily Core'})),'Team Intelligence Daily Core');window.P2USlip.open();}
  function openAutoInLab(key){
    const row=autoRegistry.get(String(key));if(!row)return;
    $('lab-home-trait').value=row.homeTrait;$('lab-away-trait').value=row.awayTrait;populateLabMatches();
    const id=String(row.m.id);if([...$('lab-home-team').options].some(o=>o.value===id))$('lab-home-team').value=id;
    $('lab-away-team').innerHTML=`<option>${esc(row.a.team)}</option>`;
    setMode('lab');renderAnalysis(row.m);
  }

  function setMode(next){
    mode=next;document.querySelectorAll('[data-team-mode]').forEach(b=>b.classList.toggle('is-active',b.dataset.teamMode===mode));
    document.querySelectorAll('[data-team-panel]').forEach(p=>{const active=p.dataset.teamPanel===mode;p.hidden=!active;p.classList.toggle('is-active',active);});
    const url=new URL(location.href);url.searchParams.set('mode',mode);history.replaceState(null,'',url);
  }
  function init(){
    populateDateFilter();refreshLeagueFilters();updateDateSummary();
    $('team-trend-chips').innerHTML=Object.entries(trends).map(([key,cfg])=>`<button data-trend="${key}">${esc(cfg.label)}</button>`).join('');
    const traitOptions=Object.entries(trends).map(([key,cfg])=>`<option value="${key}">${esc(cfg.label)}</option>`).join('');$('lab-home-trait').innerHTML=traitOptions;$('lab-away-trait').innerHTML=traitOptions;$('lab-home-trait').value='winless';$('lab-away-trait').value='nodraws';
    document.querySelectorAll('[data-team-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.teamMode));
    document.querySelectorAll('[data-rank-view]').forEach(b=>b.onclick=()=>{view=b.dataset.rankView;renderRankings();});
    document.querySelectorAll('[data-rank-category]').forEach(b=>b.onclick=()=>{category=b.dataset.rankCategory;renderRankings();});
    document.querySelectorAll('[data-rank-polarity]').forEach(b=>b.onclick=()=>{polarity=b.dataset.rankPolarity;renderRankings();});
    document.querySelectorAll('[data-trend]').forEach(b=>b.onclick=()=>{trend=b.dataset.trend;renderTrends();});
    $('team-date-filter').onchange=e=>setSelectedDate(e.target.value);
    $('team-rank-search').oninput=e=>{rankQuery=String(e.target.value||'').trim().toLowerCase();renderRankings();};
    $('team-rank-league').onchange=e=>{rankLeague=e.target.value;renderRankings();};
    $('team-trend-search').oninput=e=>{trendQuery=String(e.target.value||'').trim().toLowerCase();renderTrends();};
    $('team-trend-league').onchange=e=>{trendLeague=e.target.value;renderTrends();};
    $('lab-home-trait').onchange=populateLabMatches;$('lab-away-trait').onchange=populateLabMatches;
    $('lab-home-team').onchange=()=>{const rows=labMatches(),selected=rows.find(x=>String(x.m.id)===$('lab-home-team').value);$('lab-away-team').innerHTML=selected?`<option>${esc(selected.away.team)}</option>`:'<option>—</option>';if(selected)renderLabPlaceholder(selected);};
    $('lab-analyse').onclick=analyseSelected;
    $('team-auto-league').onchange=e=>{autoLeague=e.target.value;renderAutoPicks();};
    $('team-auto-market').onchange=e=>{autoMarket=e.target.value;renderAutoPicks();};
    $('team-auto-search').oninput=e=>{autoQuery=String(e.target.value||'').trim().toLowerCase();renderAutoPicks();};
    document.querySelectorAll('[data-auto-view]').forEach(b=>b.onclick=()=>{autoView=b.dataset.autoView;renderAutoPicks();});
    if($('team-auto-add-core'))$('team-auto-add-core').onclick=addCoreToSlip;
    window.addEventListener('p2u:auto-learning-loaded',()=>{if(autoView==='settled')renderAutoPicks();});
    renderRankings();renderTrends();populateLabMatches();renderAutoPicks();setMode(mode);
  }
  if(window.P2U_HEADLESS_AUTO_V271){window.P2UAutoHeadlessV271={modelVersion:AUTO_MODEL_VERSION,automaticSelections,autoFixturePool,selectedFixturePool,sideRow,dateOf,fixtureKey,dailyCoreRows};return;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
