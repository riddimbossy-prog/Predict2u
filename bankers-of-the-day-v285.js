/* Predict2U v286 — Safest vs Value bankers of the day (SportyBet prices). */
(function(){
  'use strict';
  const Engine=window.P2UMarketIntelligenceV277;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);
  const fmt=v=>{const n=num(v);return n===null?'—':n.toFixed(2);};
  const implied=odds=>odds>1?1/odds:null;
  const terminal=new Set(['FT','AET','PEN','PST','CANC','ABD','AWD','WO']);
  const unresolved=m=>m&&m.homeGoals==null&&!terminal.has(String(m.status||'').toUpperCase());
  const dateOf=m=>String(m&&m.matchDate||m&&m.kickoff||'').slice(0,10);
  const kickMs=m=>{const t=Date.parse(m&&m.kickoff||m&&m.matchDate||'');return Number.isFinite(t)?t:null;};
  const displayTime=m=>{
    const t=kickMs(m);if(t===null)return '';
    return new Date(t).toLocaleString([],{weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false});
  };

  const ALIAS={
    home:['home','1','Home','homeWin'],
    away:['away','2','Away','awayWin'],
    draw:['draw','X','Draw'],
    dc1x:['dc1x','1X','double1x','DC1X'],
    dcx2:['dcx2','X2','doublex2','DCX2'],
    dc12:['dc12','12','double12','DC12'],
    over15:['over15','O1.5','o15','Over 1.5'],
    under15:['under15','U1.5','u15','Under 1.5'],
    over25:['over25','O2.5','o25','Over 2.5'],
    under25:['under25','U2.5','u25','Under 2.5'],
    over35:['over35','O3.5','o35','Over 3.5'],
    under35:['under35','U3.5','u35','Under 3.5'],
    bttsYes:['bttsYes','GG','btts','BTTS','btts_yes'],
    bttsNo:['bttsNo','NG','btts_no']
  };

  const SPORTBET={
    home:{code:'1',label:'1 — Home Win'},
    away:{code:'2',label:'2 — Away Win'},
    draw:{code:'X',label:'X — Draw'},
    dc1x:{code:'1X',label:'1X — Home or Draw'},
    dcx2:{code:'X2',label:'X2 — Draw or Away'},
    dc12:{code:'12',label:'12 — No Draw'},
    over15:{code:'O1.5',label:'Over 1.5 Goals'},
    under15:{code:'U1.5',label:'Under 1.5 Goals'},
    over25:{code:'O2.5',label:'Over 2.5 Goals'},
    under25:{code:'U2.5',label:'Under 2.5 Goals'},
    over35:{code:'O3.5',label:'Over 3.5 Goals'},
    under35:{code:'U3.5',label:'Under 3.5 Goals'},
    bttsYes:{code:'GG',label:'GG — Both Teams to Score'},
    bttsNo:{code:'NG',label:'NG — One Team Blanks'}
  };

  const state={window:'today',league:'all'};

  function pickOdds(bag,keys){
    if(!bag||typeof bag!=='object')return null;
    for(const key of keys){
      const n=num(bag[key]);
      if(n!==null&&n>1)return n;
    }
    return null;
  }

  function oddsFrom1x2(m,key){
    const bag=m&&m.odds||{};
    const h=pickOdds(bag,ALIAS.home),d=pickOdds(bag,ALIAS.draw),a=pickOdds(bag,ALIAS.away);
    if(!h||!d||!a)return null;
    const ph=1/h,pd=1/d,pa=1/a,sum=ph+pd+pa;
    if(sum<=0)return null;
    const n={home:ph/sum,draw:pd/sum,away:pa/sum};
    if(key==='dc1x')return 1/Math.max(0.05,n.home+n.draw);
    if(key==='dcx2')return 1/Math.max(0.05,n.draw+n.away);
    if(key==='dc12')return 1/Math.max(0.05,n.home+n.away);
    return null;
  }

  function hasSporty(m){
    return !!(m&&((m.oddsSources&&m.oddsSources.sportybet)||(m.oddsMeta&&m.oddsMeta.provider==='sportybet')||m.sportyEventId));
  }

  function resolveOdds(m,key){
    const sporty=m&&m.oddsSources&&m.oddsSources.sportybet;
    const sportyHit=pickOdds(sporty,ALIAS[key]||[key]);
    if(sportyHit!==null)return sportyHit;
    const bag=m&&m.odds||{};
    const direct=pickOdds(bag,ALIAS[key]||[key]);
    if(direct!==null)return direct;
    if(Engine&&typeof Engine.oddsValue==='function'){
      const engine=num(Engine.oddsValue(m,key));
      if(engine!==null&&engine>1)return engine;
    }
    return oddsFrom1x2(m,key);
  }

  function hasBook(m){
    if(hasSporty(m))return true;
    const bag=m&&m.odds;
    if(!bag||typeof bag!=='object')return false;
    return Object.keys(bag).some(k=>num(bag[k])>1);
  }

  function leagueWeight(league){
    const s=String(league||'').toLowerCase();
    if(/uefa champions|champions league|europa league|conference league/.test(s))return 34;
    if(/premier league|la liga|serie a|bundesliga|ligue 1/.test(s)&&!/2|b|women/.test(s))return 32;
    if(/eredivisie|primeira|liga portugal|championship|liga mx|mls|brasileir|liga profesional|scottish premiership|super lig|j1|k league|belgian|swiss super|austrian|danish super|swedish allsvenskan|eliteserien/.test(s))return 20;
    if(/2\. bundesliga|ligue 2|serie b|segunda|efl|league one|primeira liga/.test(s))return 12;
    if(/1\. liga|virsliga|meistriliiga|premium liiga|first league/.test(s))return 2;
    return 6;
  }

  function windowOk(m){
    const t=kickMs(m);if(t===null)return false;
    const now=Date.now();
    if(t<now-5*60000)return false;
    if(state.window==='36h')return t<=now+36*3600000;
    if(state.window==='weekend'){
      const d=new Date(t).getUTCDay();
      return t<now+5*86400000&&(d===0||d===5||d===6);
    }
    const today=new Date().toISOString().slice(0,10);
    return dateOf(m)===today;
  }

  function matches(){
    return (Array.isArray(window.MATCHES)?window.MATCHES:[]).filter(unresolved).filter(windowOk)
      .filter(m=>state.league==='all'||m.league===state.league);
  }

  function goalsExtra(m){
    if(!Engine)return [];
    const h=Engine.sideProfile(m,'home'),a=Engine.sideProfile(m,'away');
    if(!h.games||!a.games||h.games<8||a.games<8)return [];
    const homeGF=num(h.gf),awayGF=num(a.gf),homeGA=num(h.ga),awayGA=num(a.ga);
    const combined=(homeGF??0)+(awayGF??0);
    const projection=((homeGF??1.25)+(awayGA??1.25))/2+((awayGF??1.10)+(homeGA??1.10))/2;
    const out=[];
    const row=(market,canonical,oddsKey,score,reasons,why)=>({
      group:'goals',market,canonical,oddsKey,score,odds:resolveOdds(m,oddsKey),reasons,why
    });
    if(combined>=3.2&&(homeGF??0)>=1.6&&(awayGF??0)>=1.2&&((homeGA??0)>=1.4||(awayGA??0)>=1.4)){
      out.push(row('Over 2.5 Goals','Over 2.5 Goals','over25',Math.min(96,82+Math.min(10,(combined-3.2)*8)),
        [`Combined attack ${combined.toFixed(2)} goals per game`,`Projected total ${projection.toFixed(2)}`],
        `Both attacks show up. ${h.team} average ${homeGF===null?'solid':homeGF.toFixed(1)} at home and ${a.team} average ${awayGF===null?'enough':awayGF.toFixed(1)} away, with at least one defence leaking. Over 2.5 is the goals play.`));
    }else if(combined>=2.6&&((homeGF??0)>=1.4||(awayGF??0)>=1.2)){
      out.push(row('Over 1.5 Goals','Over 1.5 Goals','over15',Math.min(94,84+Math.min(8,(combined-2.6)*6)),
        [`Combined attack ${combined.toFixed(2)}`,`Projected total ${projection.toFixed(2)}`],
        `This should not stay 0-0. Together they average ${combined.toFixed(1)} goals a game, so Over 1.5 is the safer goals banker.`));
    }else if(combined<=2.0&&(homeGF??0)<1.2&&(awayGF??0)<1.1){
      out.push(row('Under 2.5 Goals','Under 2.5 Goals','under25',Math.min(93,84+Math.min(7,(2.0-combined)*8)),
        [`Two blunt attacks (${combined.toFixed(2)} combined)`],
        `Neither attack looks sharp enough to blow this open. Combined they create about ${combined.toFixed(1)} a game, so Under 2.5 is the controlled play.`));
    }else if(projection<=2.45&&(homeGF??0)+(awayGF??0)<=2.6){
      out.push(row('Under 3.5 Goals','Under 3.5 Goals','under35',Math.min(92,83+Math.min(6,(2.45-projection)*6)),
        [`Projected total ${projection.toFixed(2)}`],
        `A tighter game on paper. Projected total sits around ${projection.toFixed(1)}, so Under 3.5 is the goals safety net.`));
    }
    return out.filter(r=>r.score>=82);
  }

  function sportyLabel(row){
    const key=row.oddsKey||'';
    const mapped=SPORTBET[key];
    if(mapped){
      if(key==='home'&&row.match)return `1 — ${row.match.home} Win`;
      if(key==='away'&&row.match)return `2 — ${row.match.away} Win`;
      if(key==='dc1x'&&row.match)return `1X — ${row.match.home} or Draw`;
      if(key==='dcx2'&&row.match)return `X2 — Draw or ${row.match.away}`;
      return mapped.label;
    }
    return row.market||row.canonical||'Market';
  }

  function sportyCode(row){
    return (SPORTBET[row.oddsKey]||{}).code||'';
  }

  function explain(row){
    if(row.why&&!/Price is still loading/i.test(row.why)&&!/Board price/i.test(row.why))return row.why;
    const bits=(row.reasons||[]).filter(Boolean);
    const price=row.odds;
    const market=sportyLabel(row);
    const priceBit=price?` SportyBet ${fmt(price)}.`:'';
    const m=row.match||{};
    if(/1X/.test(market))return `${m.home} are hard to beat at home on the current split. ${bits[0]||''} ${bits[1]||''}${priceBit} That is a safest-style Double Chance, not a straight win.`.replace(/\s+/g,' ').trim();
    if(/X2/.test(market))return `${m.away} travel well enough that laying the home win makes sense. ${bits.join(' ')}${priceBit}`.replace(/\s+/g,' ').trim();
    if(/12|No Draw/.test(market))return `Both sides play for a result more than a share. ${bits.join(' ')}${priceBit}`.replace(/\s+/g,' ').trim();
    if(/Over 2\.5|O2\.5/.test(market))return `This has goals in it. ${bits.join(' ')}${priceBit}`.replace(/\s+/g,' ').trim();
    if(/Over 1\.5|O1\.5/.test(market))return `One goal is unlikely to be the end of it. ${bits.join(' ')}${priceBit}`.replace(/\s+/g,' ').trim();
    if(/Under/.test(market))return `The attacks do not justify a shootout. ${bits.join(' ')}${priceBit}`.replace(/\s+/g,' ').trim();
    if(/GG/.test(market))return `Both teams score often enough in this venue split. ${bits.join(' ')}${priceBit}`.replace(/\s+/g,' ').trim();
    if(/NG/.test(market))return `One side is likely to blank. ${bits.join(' ')}${priceBit}`.replace(/\s+/g,' ').trim();
    if(/Win| 1 —| 2 —/.test(market))return `${market} is the cleanest result lean. ${bits.join(' ')}${priceBit}`.replace(/\s+/g,' ').trim();
    return `${bits.join(' ')||'Venue splits agree on this line.'}${priceBit}`.replace(/\s+/g,' ').trim();
  }

  function familyOf(row){
    const key=row.oddsKey||'';
    const text=`${row.market||''} ${row.canonical||''} ${key}`;
    if(/dc1x|dcx2|over15|under35|bttsNo|1X|X2|Over 1\.5|Under 3\.5|NG/.test(text))return 'safe';
    if(/home|away|over25|bttsYes|dc12|to Win|Over 2\.5|GG|No Draw|12/.test(text))return 'value';
    return 'value';
  }

  function laneFor(row){
    const price=num(row.odds);
    const score=num(row.score)||0;
    const impl=price?implied(price):null;
    const model=Math.min(0.92,Math.max(0.50,score/100));
    const edge=impl===null?Math.max(0,model-0.62):model-impl;
    const family=familyOf(row);
    if(score<82)return null;
    if(price!==null&&price>2.70)return null;
    if(family==='safe'){
      if(price!==null&&price>1.62&&score<90)return {lane:'value',edge,price,score,family};
      return {lane:'safe',edge,price,score,family};
    }
    if(price!==null&&price<=1.38&&score>=90)return {lane:'safe',edge,price,score,family};
    return {lane:'value',edge,price,score,family};
  }

  function rank(row){
    const booked=row.odds?18:0;
    const sporty=hasSporty(row.match)?12:0;
    const league=leagueWeight(row.match&&row.match.league);
    const edge=(row.edge||0)*24;
    return row.score+booked+sporty+league+edge;
  }

  function build(){
    if(!Engine)return {safe:[],value:[],pool:0,priced:0};
    const pool=matches();
    const rows=[];
    for(const group of ['double','goals','btts','result']){
      Engine.buildEdgeRows(pool,group).forEach(row=>{
        row.odds=resolveOdds(row.match,row.oddsKey);
        rows.push(row);
      });
    }
    pool.forEach(m=>{
      goalsExtra(m).forEach(extra=>{
        extra.match=m;
        extra.h=Engine.sideProfile(m,'home');
        extra.a=Engine.sideProfile(m,'away');
        extra.odds=resolveOdds(m,extra.oddsKey);
        rows.push(extra);
      });
    });
    const byMatch=new Map();
    rows.forEach(row=>{
      const m=row.match;if(!m)return;
      const tagged=laneFor(row);if(!tagged)return;
      const key=String(m.id!=null?m.id:`${m.home}|${m.away}|${dateOf(m)}`);
      const pack={...row,...tagged,key,label:sportyLabel({...row,match:m}),code:sportyCode(row),booked:hasBook(m)};
      pack.why=explain(pack);
      const old=byMatch.get(key);
      if(!old||rank(pack)>rank(old))byMatch.set(key,pack);
    });
    const safe=[],value=[];
    [...byMatch.values()].sort((a,b)=>rank(b)-rank(a)).forEach(row=>{
      if(row.lane==='safe'&&safe.length<8)safe.push(row);
      else if(row.lane==='value'&&value.length<8)value.push(row);
    });
    safe.sort((a,b)=>(a.odds||1.35)-(b.odds||1.35));
    value.sort((a,b)=>(b.edge||0)-(a.edge||0));
    return {safe,value,pool:pool.length,priced:pool.filter(hasBook).length};
  }

  function card(row,idx){
    const m=row.match;
    const priceLabel=row.odds?(hasSporty(m)?'SPORTYBET':row.booked?'BOARD':'GUIDE'):'TBD';
    return `<article class="p2u-bankers-card is-${row.lane}">
      <div class="p2u-bankers-card-top">
        <div>
          <h3>${esc(m.home)} vs ${esc(m.away)}</h3>
          <small>${esc(m.league||'Football')} · ${esc(displayTime(m)||dateOf(m))}</small>
        </div>
        <div class="p2u-bankers-price">
          <b>${fmt(row.odds)}</b>
          <em>${priceLabel} · ${row.lane==='safe'?'SAFE':'VALUE'} · ${Math.round(row.score)}</em>
        </div>
      </div>
      <div class="p2u-bankers-pick">
        <span>${row.code?esc(row.code)+' · ':''}${row.lane==='safe'?'SAFEST MARKET':'VALUE MARKET'}</span>
        <strong>${esc(row.label)}</strong>
      </div>
      <p class="p2u-bankers-why">${esc(row.why)}</p>
      <div class="p2u-bankers-actions"><button type="button" data-banker-slip="${row.lane}-${idx}">+ Add to Slip</button></div>
    </article>`;
  }

  function acca(rows){
    const priced=rows.map(r=>num(r.odds)).filter(v=>v&&v>1);
    if(!priced.length)return 'Combined —';
    const total=priced.reduce((a,b)=>a*b,1);
    return `Combined ${fmt(total)} from ${priced.length} priced pick${priced.length===1?'':'s'}`;
  }

  function fillLeagues(pool){
    const sel=$('bankers-league');if(!sel)return;
    const current=sel.value||'all';
    const leagues=[...new Set(pool.map(m=>m.league).filter(Boolean))].sort((a,b)=>leagueWeight(b)-leagueWeight(a)||a.localeCompare(b));
    sel.innerHTML='<option value="all">All leagues</option>';
    leagues.forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;sel.appendChild(o);});
    sel.value=leagues.includes(current)?current:'all';
    state.league=sel.value;
  }

  function render(){
    const {safe,value,pool,priced}=build();
    fillLeagues((Array.isArray(window.MATCHES)?window.MATCHES:[]).filter(unresolved).filter(windowOk));
    const merge=window.P2U_SPORTYBET_MERGE;
    const sportyBit=merge?` · ${merge.matched} matched to SportyBet`:'';
    if($('bankers-meta'))$('bankers-meta').textContent=`${pool} upcoming fixtures · ${priced} with SportyBet odds · ${safe.length} safest · ${value.length} value${sportyBit}`;
    if($('safe-acca'))$('safe-acca').textContent=acca(safe);
    if($('value-acca'))$('value-acca').textContent=acca(value);
    if($('safe-list'))$('safe-list').innerHTML=safe.length?safe.map((row,i)=>card(row,i)).join(''):'<div class="p2u-bankers-empty">No safest banker cleared the short-odds gate for this window.</div>';
    if($('value-list'))$('value-list').innerHTML=value.length?value.map((row,i)=>card(row,i)).join(''):'<div class="p2u-bankers-empty">No value banker cleared the price-vs-stats gate for this window.</div>';
    const registry={};
    safe.forEach((row,i)=>registry['safe-'+i]=row);
    value.forEach((row,i)=>registry['value-'+i]=row);
    document.querySelectorAll('[data-banker-slip]').forEach(btn=>{
      btn.onclick=()=>{
        const row=registry[btn.dataset.bankerSlip];
        if(!row||!window.P2USlip)return;
        window.P2USlip.add(row.match,row.canonical||row.market,'Bankers of the Day');
        if(typeof window.P2USlip.open==='function')window.P2USlip.open();
      };
    });
    document.querySelectorAll('[data-banker-acca]').forEach(btn=>{
      btn.onclick=()=>{
        const pack=btn.dataset.bankerAcca==='safe'?safe:value;
        if(!window.P2USlip||!pack.length)return;
        pack.forEach(row=>window.P2USlip.add(row.match,row.canonical||row.market,'Bankers of the Day'));
        if(typeof window.P2USlip.open==='function')window.P2USlip.open();
      };
    });
  }

  function init(){
    if($('bankers-window')){
      $('bankers-window').value=state.window;
      $('bankers-window').addEventListener('change',e=>{state.window=e.target.value;render();});
    }
    if($('bankers-league'))$('bankers-league').addEventListener('change',e=>{state.league=e.target.value;render();});
    window.addEventListener('p2u:sportybet-merged',render);
    if(window.P2USportyBetMerge&&typeof window.P2USportyBetMerge.apply==='function')window.P2USportyBetMerge.apply();
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
