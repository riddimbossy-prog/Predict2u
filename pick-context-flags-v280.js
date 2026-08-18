/* Predict2U v280 — site-wide contextual caution flags for published tips. */
(function(){
  'use strict';

  const VERSION='v280';
  const CARD_SELECTOR='[data-p2u-home][data-p2u-away],.p2u-pick,.p2u-market-card.is-edge,.p2u-fullboard-top-card';
  const TERMINAL=new Set(['FT','AET','PEN','PST','CANC','ABD','AWD','WO']);
  const num=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);
  const rate=v=>{const n=num(v);return n===null?null:(n>1.00001?n/100:n);};
  const first=(...values)=>{for(const value of values){const n=num(value);if(n!==null)return n;}return null;};
  const norm=v=>String(v||'').trim().toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim();
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pct=v=>v===null?'':`${Math.round(v*100)}%`;
  const absDiff=(a,b)=>a===null||b===null?null:Math.abs(a-b);
  const validMatch=m=>m&&m.home&&m.away;
  const fixtureDate=m=>String(m&&m.matchDate||m&&m.kickoff||'').slice(0,10);

  let indexedArray=null;
  let indexedLength=-1;
  let byId=new Map();
  let byPair=new Map();
  let leagueProfiles=new Map();
  let scanTimer=null;
  let observer=null;

  function latestScore(m){
    const t=Date.parse(m&&m.kickoff||m&&m.matchDate||'');
    return Number.isFinite(t)?t:0;
  }

  function sideGames(m,side){
    const st=m&&m[`${side}Streaks`]||{},advanced=st.advanced||{},htft=st.htft||{},profile=m&&m[`${side}Profile`]||{};
    return first(m&&m[`${side}VenueGames`],advanced.samples&&advanced.samples.splitVenue,htft.ftSample,st.sample,profile.games);
  }

  function sidePPG(m,side){
    const games=sideGames(m,side),pts=first(m&&m[`${side}VenuePts`]);
    if(games&&pts!==null)return pts/games;
    const st=m&&m[`${side}Streaks`]||{},advanced=st.advanced||{};
    return first(m&&m[`${side}PPG`],m&&m[`${side}Recent10PPG`],advanced.recent10PPG);
  }

  function sideRate(m,side,key){
    const st=m&&m[`${side}Streaks`]||{},htft=st.htft||{};
    const map={
      over15:[m&&m[`${side}Over15Rate`]],
      over25:[m&&m[`${side}Over25Rate`]],
      over35:[m&&m[`${side}Over35Rate`]],
      win:[m&&m[`${side}WinRate`],htft.ftWin],
      draw:[m&&m[`${side}DrawRate`],htft.ftDraw],
      loss:[m&&m[`${side}LossRate`],htft.ftLoss]
    };
    const xs=map[key]||[];
    for(const value of xs){const r=rate(value);if(r!==null)return r;}
    return null;
  }

  function sideGoals(m,side){
    const profile=m&&m[`${side}Profile`]||{},home=side==='home';
    const gf=home?first(m&&m.homeScoredAtHome,profile.goalsFor&&profile.goalsFor.v):first(m&&m.awayScoredAway,profile.goalsFor&&profile.goalsFor.v);
    const ga=home?first(m&&m.homeConcededAtHome,profile.goalsAg&&profile.goalsAg.v):first(m&&m.awayConcededAway,profile.goalsAg&&profile.goalsAg.v);
    return {gf,ga,total:gf!==null&&ga!==null?gf+ga:null};
  }

  function formString(m,side){
    const st=m&&m[`${side}Streaks`]||{},advanced=st.advanced||{};
    return String(m&&m[`${side}Recent10Form`]||advanced.recent10Form||m&&m[`${side}Form`]||'').toUpperCase().replace(/[^WDL]/g,'').slice(-5);
  }

  function formPPG(m,side){
    const form=formString(m,side);
    if(form.length>=3){
      let points=0;
      for(const ch of form)points+=ch==='W'?3:ch==='D'?1:0;
      return points/form.length;
    }
    const st=m&&m[`${side}Streaks`]||{},advanced=st.advanced||{};
    return first(m&&m[`${side}Recent10PPG`],advanced.recent10PPG);
  }

  function sidePosition(m,side){return first(m&&m[`${side}Pos`],m&&m[`${side}Position`]);}
  function tableSize(m){return first(m&&m.tableSize,m&&m.venueTableSize,m&&m.leagueSize);}

  function explicitMotivation(m,side){
    const keys=[`${side}Motivation`,`${side}Objective`,`${side}Stakes`,`${side}Incentive`,`${side}Target`];
    for(const key of keys){
      const raw=m&&m[key];
      if(typeof raw==='string'&&raw.trim())return norm(raw);
    }
    return '';
  }

  function motivationBand(m,side){
    const explicit=explicitMotivation(m,side);if(explicit)return `explicit:${explicit}`;
    const pos=sidePosition(m,side),size=tableSize(m);
    if(pos===null||size===null||size<8)return '';
    const top=Math.max(2,Math.ceil(size*.15));
    const upper=Math.max(top+1,Math.ceil(size*.30));
    const lower=Math.max(upper+1,Math.floor(size*.80));
    if(pos<=top)return 'title-promotion';
    if(pos<=upper)return 'continental-playoff';
    if(pos>=lower)return 'survival-relegation';
    return 'mid-table';
  }

  function roundNumber(m){
    const direct=first(m&&m.roundNumber,m&&m.fixtureRound,m&&m.matchday,m&&m.gameweek,m&&m.week);
    if(direct!==null)return direct;
    const raw=String(m&&m.round||m&&m.roundName||'');
    const hit=raw.match(/\b(\d{1,2})\b/);return hit?Number(hit[1]):null;
  }

  function isEarlySeason(m){
    const round=roundNumber(m);
    if(round!==null&&round<=6)return {yes:true,reason:`Round ${Math.round(round)}`};
    const hg=sideGames(m,'home'),ag=sideGames(m,'away');
    if(hg!==null&&ag!==null&&Math.max(hg,ag)<=5)return {yes:true,reason:`only ${Math.max(hg,ag)} venue games in the larger split sample`};
    return {yes:false,reason:''};
  }

  function readObjectRate(obj,keys){
    if(!obj||typeof obj!=='object')return null;
    for(const key of keys){
      if(Object.prototype.hasOwnProperty.call(obj,key)){
        const r=rate(obj[key]);if(r!==null)return r;
      }
    }
    return null;
  }

  function directLeagueProfile(m){
    const trends=m&&m.leagueTrends||m&&m.leagueProfile||m&&m.competitionTrends||{};
    const rates=trends&&trends.rates||trends&&trends.markets||trends||{};
    const over25=readObjectRate(rates,['Over 2.5','Over2.5','over25','o25','over_2_5']);
    const over15=readObjectRate(rates,['Over 1.5','Over1.5','over15','o15','over_1_5']);
    const btts=readObjectRate(rates,['BTTS Yes','BTTS','bttsYes','btts','gg']);
    const avgGoals=first(trends&&trends.avgGoals,trends&&trends.averageGoals,trends&&trends.goalsPerMatch,trends&&trends.avgTotalGoals,m&&m.leagueAvgGoals);
    if(over25===null&&over15===null&&avgGoals===null)return null;
    return {over25,over15,btts,avgGoals,source:'league trend feed'};
  }

  function buildLeagueProfiles(matches){
    const buckets=new Map();
    for(const m of matches){
      if(!validMatch(m)||!m.league)continue;
      const league=String(m.league),key=norm(league);if(!key)continue;
      let bucket=buckets.get(key);if(!bucket){bucket={league,profiles:new Map()};buckets.set(key,bucket);}
      for(const side of ['home','away']){
        const team=String(m[side]||'');if(!team)continue;
        const pkey=`${norm(team)}|${side}`;
        const row={games:sideGames(m,side),over25:sideRate(m,side,'over25'),over15:sideRate(m,side,'over15'),goals:sideGoals(m,side).total,when:latestScore(m)};
        const old=bucket.profiles.get(pkey);
        const rowQuality=(row.games||0)+(row.over25!==null?2:0)+(row.goals!==null?1:0);
        const oldQuality=old?(old.games||0)+(old.over25!==null?2:0)+(old.goals!==null?1:0):-1;
        if(!old||rowQuality>oldQuality||(rowQuality===oldQuality&&row.when>old.when))bucket.profiles.set(pkey,row);
      }
    }
    const out=new Map();
    for(const [key,bucket] of buckets){
      const rows=[...bucket.profiles.values()];
      const avg=field=>{const values=rows.map(r=>r[field]).filter(v=>v!==null&&Number.isFinite(v));return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;};
      out.set(key,{league:bucket.league,over25:avg('over25'),over15:avg('over15'),avgGoals:avg('goals'),sample:rows.length,source:'split-profile aggregate'});
    }
    return out;
  }

  function classifyLeague(profile){
    if(!profile)return {band:'unknown'};
    const {over25,over15,avgGoals}=profile;
    let band='neutral';
    const high=(over25!==null&&over25>=.60)||(avgGoals!==null&&avgGoals>=2.85&&(over15===null||over15>=.76));
    const low=(over25!==null&&over25<=.42)||(avgGoals!==null&&avgGoals<=2.35&&(over15===null||over15<=.72));
    if(high&&!low)band='high'; else if(low&&!high)band='low';
    return {...profile,band};
  }

  function leagueProfileFor(m){
    const direct=directLeagueProfile(m);
    if(direct)return classifyLeague(direct);
    return classifyLeague(leagueProfiles.get(norm(m&&m.league))||null);
  }

  function buildIndex(){
    const matches=Array.isArray(window.MATCHES)?window.MATCHES.filter(validMatch):[];
    if(indexedArray===window.MATCHES&&indexedLength===matches.length)return matches;
    indexedArray=window.MATCHES;indexedLength=matches.length;byId=new Map();byPair=new Map();
    for(const m of matches){
      if(m.id!==null&&m.id!==undefined&&String(m.id))byId.set(String(m.id),m);
      const key=`${norm(m.home)}|${norm(m.away)}`;
      const old=byPair.get(key);if(!old||latestScore(m)>=latestScore(old))byPair.set(key,m);
    }
    leagueProfiles=buildLeagueProfiles(matches);
    return matches;
  }

  function textOf(el,selector){const node=el&&el.querySelector&&el.querySelector(selector);return node?String(node.textContent||'').trim():'';}

  function inferredTeams(card){
    let home=String(card&&card.dataset&&card.dataset.p2uHome||''),away=String(card&&card.dataset&&card.dataset.p2uAway||'');
    if(home&&away)return {home,away};
    const marketTeams=card.querySelectorAll&&card.querySelectorAll('.p2u-market-match strong,.p2u-pick-match strong');
    if(marketTeams&&marketTeams.length>=2){home=marketTeams[0].textContent.trim();away=marketTeams[1].textContent.trim();return {home,away};}
    const fullboardTeams=card.querySelectorAll&&card.querySelectorAll('.p2u-fullboard-team');
    if(fullboardTeams&&fullboardTeams.length>=2)return {home:fullboardTeams[0].textContent.trim(),away:fullboardTeams[1].textContent.trim()};
    const homeNode=card.querySelector&&card.querySelector('.p2u-team-home .p2u-team-name,.p2u-team-home');
    const awayNode=card.querySelector&&card.querySelector('.p2u-team-away .p2u-team-name,.p2u-team-away');
    if(homeNode&&awayNode)return {home:homeNode.textContent.trim(),away:awayNode.textContent.trim()};
    return {home:'',away:''};
  }

  function findMatch(card){
    buildIndex();
    const id=String(card&&card.dataset&&(card.dataset.p2uFixtureId||card.dataset.fixtureId)||'');
    if(id&&byId.has(id))return byId.get(id);
    const teams=inferredTeams(card),key=`${norm(teams.home)}|${norm(teams.away)}`;
    return key!=='|'?byPair.get(key)||null:null;
  }

  function marketText(card){
    const ds=card&&card.dataset||{};
    const fromData=ds.p2uMarket||ds.autoMarket||ds.market||'';if(fromData)return String(fromData).trim();
    const selectors=['.p2u-prediction-market','.p2u-fullboard-market','.p2u-market-pick h3','.p2u-auto-market h3','.engine-market','.p2u-acca-market','.mkt','.p2u-market strong'];
    for(const selector of selectors){const text=textOf(card,selector);if(text)return text;}
    return '';
  }

  function canonicalMarket(raw){
    const s=norm(raw).replace(/goals?/g,'').trim();
    if(/under\s*3\s*5|u\s*3\s*5/.test(s))return 'UNDER35';
    if(/under\s*2\s*5|u\s*2\s*5/.test(s))return 'UNDER25';
    if(/under\s*1\s*5|u\s*1\s*5/.test(s))return 'UNDER15';
    if(/over\s*3\s*5|o\s*3\s*5/.test(s))return 'OVER35';
    if(/over\s*2\s*5|o\s*2\s*5/.test(s))return 'OVER25';
    if(/over\s*1\s*5|o\s*1\s*5/.test(s))return 'OVER15';
    if(/btts\s*(yes)?|both teams to score\s*(yes)?|\bgg\b/.test(s)&&!/no|not/.test(s))return 'BTTS_YES';
    if(/btts\s*no|both teams.*not.*score|\bng\b/.test(s))return 'BTTS_NO';
    if(/first half.*over\s*0\s*5|1st half.*over\s*0\s*5|1h\s*o\s*0\s*5/.test(s))return 'FH_OVER05';
    if(/first half.*under\s*1\s*5|1st half.*under\s*1\s*5|1h\s*u\s*1\s*5/.test(s))return 'FH_UNDER15';
    return String(raw||'').trim().toUpperCase();
  }

  function shortMarket(code,raw){
    const labels={UNDER35:'U3.5',UNDER25:'U2.5',UNDER15:'U1.5',OVER35:'O3.5',OVER25:'O2.5',OVER15:'O1.5',BTTS_YES:'GG',BTTS_NO:'NG',FH_OVER05:'1H O0.5',FH_UNDER15:'1H U1.5'};
    return labels[code]||String(raw||'this market');
  }

  function leagueMismatchWarning(m,marketCode,rawMarket){
    const league=leagueProfileFor(m),short=shortMarket(marketCode,rawMarket);
    if(!league||league.band==='unknown'||league.band==='neutral')return null;
    const highConflict=['UNDER35','UNDER25','UNDER15','BTTS_NO'].includes(marketCode);
    const lowConflict=['OVER15','OVER25','OVER35','BTTS_YES'].includes(marketCode);
    if(league.band==='high'&&highConflict){
      const evidence=league.over25!==null?`League O2.5 profile ${pct(league.over25)}`:(league.avgGoals!==null?`League goals profile ${league.avgGoals.toFixed(2)} per match`:'League scoring profile is high');
      return {code:'LEAGUE_HIGH_SCORING',label:`High-scoring league — be careful with ${short}.`,detail:evidence};
    }
    if(league.band==='low'&&lowConflict){
      const evidence=league.over25!==null?`League O2.5 profile ${pct(league.over25)}`:(league.avgGoals!==null?`League goals profile ${league.avgGoals.toFixed(2)} per match`:'League scoring profile is low');
      return {code:'LEAGUE_LOW_SCORING',label:`Low-scoring league — be careful with ${short}.`,detail:evidence};
    }
    return null;
  }

  function similarityWarning(m){
    const hp=sidePosition(m,'home'),ap=sidePosition(m,'away'),positionGap=absDiff(hp,ap);
    const hs=sidePPG(m,'home'),as=sidePPG(m,'away'),strengthGap=absDiff(hs,as);
    const hf=formPPG(m,'home'),af=formPPG(m,'away'),formGap=absDiff(hf,af);
    const hm=motivationBand(m,'home'),am=motivationBand(m,'away');
    if(positionGap===null||strengthGap===null||formGap===null||!hm||!am)return null;
    if(!(positionGap<=2&&strengthGap<=.25&&formGap<=.40&&hm===am))return null;
    return {code:'BALANCED_MATCHUP',label:'Teams are similar in form, position, strength and motivation — treat this as a balanced matchup.',detail:`Position gap ${Math.round(positionGap)} · split PPG gap ${strengthGap.toFixed(2)} · form PPG gap ${formGap.toFixed(2)}`};
  }

  function warningsFor(m,rawMarket){
    if(!m||!rawMarket)return [];
    const marketState=norm(rawMarket);
    if(/^(?:no qualified pick|analysis pending|no bet|pending|no pick)$/.test(marketState))return [];
    const out=[],marketCode=canonicalMarket(rawMarket);
    const mismatch=leagueMismatchWarning(m,marketCode,rawMarket);if(mismatch)out.push(mismatch);
    const early=isEarlySeason(m);if(early.yes)out.push({code:'EARLY_SEASON',label:'Early-season matchup — form and split samples can still move quickly.',detail:early.reason});
    const balanced=similarityWarning(m);if(balanced)out.push(balanced);
    return out;
  }

  function flagMarkup(flags){
    return `<aside class="p2u-context-flags-v280" data-p2u-context-flags="${VERSION}" role="note" aria-label="Context caution${flags.length===1?'':'s'}"><div class="p2u-context-flags-head"><span class="p2u-context-red-flag" aria-hidden="true">⚑</span><strong>${flags.length===1?'Context caution':'Context cautions'}</strong></div><div class="p2u-context-flags-list">${flags.map(flag=>`<div class="p2u-context-flag-item" data-context-code="${esc(flag.code)}"><span class="p2u-context-mini-flag" aria-hidden="true">⚑</span><div><b>${esc(flag.label)}</b>${flag.detail?`<small>${esc(flag.detail)}</small>`:''}</div></div>`).join('')}</div></aside>`;
  }

  function insertFlagBox(card,flags){
    const old=card.querySelector&&card.querySelector('[data-p2u-context-flags]');if(old)old.remove();
    delete card.dataset.p2uContextWarningCount;
    if(!flags.length)return;
    const wrapper=document.createElement('div');wrapper.innerHTML=flagMarkup(flags);const box=wrapper.firstElementChild;if(!box)return;
    const actions=card.querySelector&&card.querySelector('.p2u-card-actions,.p2u-fullboard-toggle,.p2u-fullboard-actions,.engine-card-foot,.p2u-auto-actions,.p2u-market-actions,.p2u-support-wrap');
    if(actions)actions.parentNode.insertBefore(box,actions);else card.appendChild(box);
    card.dataset.p2uContextWarningCount=String(flags.length);
  }

  function decorate(card){
    if(!card||!card.querySelector)return;
    const rawMarket=marketText(card);if(!rawMarket)return;
    const match=findMatch(card);if(!match)return;
    if(TERMINAL.has(String(match.status||'').toUpperCase())&&match.homeGoals==null)return;
    const signature=`${VERSION}|${String(match.id!=null?match.id:`${match.home}|${match.away}|${fixtureDate(match)}`)}|${canonicalMarket(rawMarket)}`;
    if(card.dataset.p2uContextFlagSignature===signature)return;
    card.dataset.p2uContextFlagSignature=signature;
    insertFlagBox(card,warningsFor(match,rawMarket));
  }

  function scan(root=document){
    buildIndex();
    if(!Array.isArray(window.MATCHES)||!window.MATCHES.length)return 0;
    const cards=[];
    if(root&&root.matches&&root.matches(CARD_SELECTOR))cards.push(root);
    if(root&&root.querySelectorAll)cards.push(...root.querySelectorAll(CARD_SELECTOR));
    const unique=[...new Set(cards)];unique.forEach(decorate);return unique.length;
  }

  function schedule(root=document){clearTimeout(scanTimer);scanTimer=setTimeout(()=>scan(root),35);}

  function startObserver(){
    if(observer||!document.body)return;
    observer=new MutationObserver(mutations=>{for(const mutation of mutations){for(const node of mutation.addedNodes){if(node&&node.nodeType===1){schedule(document);return;}}}});
    observer.observe(document.body,{childList:true,subtree:true});
  }

  function waitForData(attempt=0){
    buildIndex();
    if(Array.isArray(window.MATCHES)&&window.MATCHES.length){scan(document);startObserver();return;}
    if(attempt<60)setTimeout(()=>waitForData(attempt+1),250);else startObserver();
  }

  function init(){waitForData();window.addEventListener('p2u:data-ready',()=>{indexedArray=null;schedule(document);});window.addEventListener('p2u:fixtures-updated',()=>{indexedArray=null;schedule(document);});}
  window.P2UContextFlagsV280={version:VERSION,scan,warningsFor,leagueProfileFor,isEarlySeason,similarityWarning,canonicalMarket};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
