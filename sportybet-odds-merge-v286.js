/* Predict2U v286 — merge SportyBet overlay onto MATCHES.odds */
(function(){
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const num=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);
  function normalize(value){
    return String(value||'')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/\bfootball club\b|\bsoccer club\b/g,' ')
      .replace(/\butd\b/g,' united ')
      .replace(/\b(fc|cf|sc|afc|ac|cd|fk|bk|if|sk|sv|calcio)\b/g,' ')
      .replace(/\bwomen\b|\bladies\b/g,' w ')
      .replace(/\breserves?\b/g,' ii ')
      .replace(/[^a-z0-9]+/g,' ')
      .trim().replace(/\s+/g,' ');
  }
  function tokens(value){return new Set(normalize(value).split(' ').filter(Boolean));}
  function jaccard(a,b){
    const A=tokens(a),B=tokens(b);
    if(!A.size||!B.size)return 0;
    let inter=0;for(const x of A)if(B.has(x))inter+=1;
    return inter/(A.size+B.size-inter);
  }
  function teamSimilarity(a,b){
    const A=normalize(a),B=normalize(b);
    if(!A||!B)return 0;
    if(A===B)return 1;
    if(A.includes(B)||B.includes(A))return Math.min(A.length,B.length)/Math.max(A.length,B.length)*0.94;
    const jac=jaccard(A,B);
    const aFirst=A.split(' ')[0],bFirst=B.split(' ')[0];
    const firstExact=aFirst&&aFirst===bFirst?0.12:0;
    const firstPrefix=aFirst&&bFirst&&aFirst.length>=3&&bFirst.length>=3&&(aFirst.startsWith(bFirst)||bFirst.startsWith(aFirst))?0.18:0;
    return clamp(jac+Math.max(firstExact,firstPrefix),0,1);
  }
  function dateOf(v){return String(v||'').slice(0,10);}
  function indexFeed(rows){
    const byDate=new Map();
    for(const row of rows||[]){
      const d=dateOf(row.matchDate||row.kickoff);
      if(!d)continue;
      if(!byDate.has(d))byDate.set(d,[]);
      byDate.get(d).push(row);
    }
    return byDate;
  }
  function matchRow(match, pool){
    if(!pool||!pool.length)return null;
    const kick=Date.parse(match.kickoff||`${match.matchDate||''}T12:00:00Z`);
    let best=null;
    for(const row of pool){
      const direct=(teamSimilarity(match.home,row.home)+teamSimilarity(match.away,row.away))/2;
      const reverse=(teamSimilarity(match.home,row.away)+teamSimilarity(match.away,row.home))/2;
      const swapped=reverse>direct;
      let score=Math.max(direct,reverse);
      const eventTime=Date.parse(row.kickoff||'');
      if(Number.isFinite(kick)&&Number.isFinite(eventTime)){
        const hours=Math.abs(kick-eventTime)/36e5;
        if(hours<=2)score+=0.12;
        else if(hours<=12)score+=0.06;
        else if(hours>36)score-=0.3;
      }
      score=clamp(score,0,1);
      if(!best||score>best.score)best={row,score,swapped};
    }
    return best&&best.score>=0.66?best:null;
  }
  function applyOdds(match, row, swapped){
    const incoming=row.odds||{};
    const mapped={...incoming};
    if(swapped){
      if(incoming.home!=null||incoming.away!=null){
        mapped.home=incoming.away; mapped.away=incoming.home;
        mapped['1']=incoming['2']||incoming.away; mapped['2']=incoming['1']||incoming.home;
      }
      if(incoming.dc1x!=null||incoming.dcx2!=null){
        mapped.dc1x=incoming.dcx2; mapped.dcx2=incoming.dc1x;
        mapped['1X']=incoming.X2||incoming.dcx2; mapped.X2=incoming['1X']||incoming.dc1x;
      }
      if(incoming.homeDnb!=null||incoming.awayDnb!=null){
        mapped.homeDnb=incoming.awayDnb; mapped.awayDnb=incoming.homeDnb;
      }
    }
    match.odds={...(match.odds||{}),...mapped};
    match.oddsSources={...(match.oddsSources||{}),sportybet:mapped};
    match.sportyEventId=row.eventId||match.sportyEventId||null;
    match.sportyGameId=row.gameId||match.sportyGameId||null;
    match.oddsMeta={
      ...(match.oddsMeta||{}),
      provider:'sportybet',
      country:(window.P2U_SPORTYBET&&window.P2U_SPORTYBET.country)||'gh',
      generatedAt:(window.P2U_SPORTYBET&&window.P2U_SPORTYBET.generatedAt)||null,
      matchScore:Number((row._score||0).toFixed?row._score:0)
    };
  }
  function apply(){
    const feed=window.P2U_SPORTYBET;
    const matches=Array.isArray(window.MATCHES)?window.MATCHES:[];
    if(!feed||!Array.isArray(feed.rows)||!matches.length)return {matched:0,considered:0};
    const byDate=indexFeed(feed.rows);
    let matched=0;
    for(const match of matches){
      const d=dateOf(match.matchDate||match.kickoff);
      const pool=[...(byDate.get(d)||[])];
      const prev=new Date(Date.parse(d+'T00:00:00Z')-86400000).toISOString().slice(0,10);
      const next=new Date(Date.parse(d+'T00:00:00Z')+86400000).toISOString().slice(0,10);
      if(byDate.get(prev))pool.push(...byDate.get(prev));
      if(byDate.get(next))pool.push(...byDate.get(next));
      const hit=matchRow(match,pool);
      if(!hit)continue;
      hit.row._score=hit.score;
      applyOdds(match,hit.row,hit.swapped);
      matched+=1;
    }
    window.P2U_SPORTYBET_MERGE={matched,considered:matches.length,generatedAt:feed.generatedAt,priced:feed.priced||feed.rows.length};
    window.dispatchEvent(new CustomEvent('p2u:sportybet-merged',{detail:window.P2U_SPORTYBET_MERGE}));
    return window.P2U_SPORTYBET_MERGE;
  }
  window.P2USportyBetMerge={apply};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();
