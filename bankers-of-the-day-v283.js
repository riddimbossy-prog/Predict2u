/* Predict2U v283 — Safest vs Value bankers of the day. */
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

  const state={window:'36h',league:'all'};

  function windowOk(m){
    const t=kickMs(m);if(t===null)return false;
    const now=Date.now();
    if(t<now-5*60000)return false;
    if(state.window==='today'){
      const today=new Date().toISOString().slice(0,10);
      return dateOf(m)===today;
    }
    if(state.window==='weekend'){
      const d=new Date(t).getUTCDay();
      return t<now+4*86400000&&(d===0||d===5||d===6);
    }
    return t<=now+36*3600000;
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
    const odds=key=>Engine.oddsValue(m,key);
    if(combined>=3.2&&(homeGF??0)>=1.6&&(awayGF??0)>=1.2&&((homeGA??0)>=1.4||(awayGA??0)>=1.4)){
      out.push({
        group:'goals',market:'Over 2.5 Goals',canonical:'Over 2.5 Goals',oddsKey:'over25',
        score:Math.min(96,82+Math.min(10,(combined-3.2)*8)),odds:odds('over25'),
        reasons:[`Combined attack ${combined.toFixed(2)} goals per game`,`Projected total ${projection.toFixed(2)}`],
        why:`Both sides create chances. Home score ${homeGF===null?'well':homeGF.toFixed(1)} a game at home and the visitors score ${awayGF===null?'enough':awayGF.toFixed(1)} away, with at least one defence leaking.`
      });
    }else if(combined>=2.6&&((homeGF??0)>=1.4||(awayGF??0)>=1.2)){
      out.push({
        group:'goals',market:'Over 1.5 Goals',canonical:'Over 1.5 Goals',oddsKey:'over15',
        score:Math.min(94,84+Math.min(8,(combined-2.6)*6)),odds:odds('over15'),
        reasons:[`Combined attack ${combined.toFixed(2)}`,`Projected total ${projection.toFixed(2)}`],
        why:`This should not stay at 0-0 or 1-0 for long. Combined they average ${combined.toFixed(1)} goals a game, so Over 1.5 is the safer goals banker.`
      });
    }else if(combined<=2.0&&(homeGF??0)<1.2&&(awayGF??0)<1.1){
      out.push({
        group:'goals',market:'Under 2.5 Goals',canonical:'Under 2.5 Goals',oddsKey:'under25',
        score:Math.min(93,84+Math.min(7,(2.0-combined)*8)),odds:odds('under25'),
        reasons:[`Two blunt attacks (${combined.toFixed(2)} combined)`],
        why:`Neither attack travels well enough to blow this open. Combined they create about ${combined.toFixed(1)} goals a game, so Under 2.5 is the controlled play.`
      });
    }else if(projection<=2.45&&(homeGF??0)+(awayGF??0)<=2.6){
      out.push({
        group:'goals',market:'Under 3.5 Goals',canonical:'Under 3.5 Goals',oddsKey:'under35',
        score:Math.min(92,83+Math.min(6,(2.45-projection)*6)),odds:odds('under35'),
        reasons:[`Projected total ${projection.toFixed(2)}`],
        why:`A tighter game on paper. The projected total sits around ${projection.toFixed(1)}, so Under 3.5 is the goals safety net rather than a smash-over.`
      });
    }
    return out.filter(row=>row.score>=82);
  }

  function explain(row){
    if(row.why)return row.why;
    const bits=row.reasons||[];
    const price=row.odds;
    const market=row.market||'this market';
    const priceBit=price?` Board price ${fmt(price)}.`:' Price is still loading.';
    if(/1X|or Draw/i.test(market))return `${row.match.home} are hard to beat at home on the current split. ${bits[0]||'The home side stays unbeaten often enough.'} ${bits[1]||''}${priceBit} That is a safest-style Double Chance, not a straight win.`.replace(/\s+/g,' ').trim();
    if(/X2|Draw or/i.test(market))return `${row.match.away} travel well enough that laying the home win makes sense. ${bits.join(' ')}${priceBit}`;
    if(/No Draw|12/.test(market))return `Both sides play for a result more than a share. ${bits.join(' ')}${priceBit}`;
    if(/Over 2\.5/.test(market))return `This has goals in it. ${bits.join(' ')}${priceBit}`;
    if(/Over 1\.5/.test(market))return `One goal is unlikely to be the end of it. ${bits.join(' ')}${priceBit}`;
    if(/Under/.test(market))return `The attacks do not justify a shootout. ${bits.join(' ')}${priceBit}`;
    if(/GG|Both Teams to Score/.test(market))return `Both teams score often enough in this venue split. ${bits.join(' ')}${priceBit}`;
    if(/NG|Not to Score/.test(market))return `One side is likely to blank. ${bits.join(' ')}${priceBit}`;
    if(/to Win|Home Win|Away Win/.test(market))return `${market} is the cleanest result lean. ${bits.join(' ')}${priceBit}`;
    return `${bits.join(' ')||'Venue splits agree on this line.'}${priceBit}`;
  }

  function laneFor(row){
    const price=num(row.odds);
    const score=num(row.score)||0;
    const impl=price?implied(price):null;
    const model=score/100;
    const edge=impl===null?0:model-impl;
    const safeMarket=/Double Chance|1X|X2|Over 1\.5|Under 3\.5|NG/.test(row.market||row.canonical||'');
    const valueMarket=/to Win|Over 2\.5|GG|No Draw|12/.test(row.market||row.canonical||'');
    const safe=score>=88&&(price===null||price<=1.50)&&safeMarket;
    const saferWin=score>=93&&price!==null&&price<=1.42;
    const value=score>=82&&price!==null&&price>=1.55&&price<=2.45&&edge>=0.06;
    const valueAlt=score>=86&&price!==null&&price>=1.50&&price<=2.20&&valueMarket;
    if(safe||saferWin)return {lane:'safe',edge,price,score};
    if(value||valueAlt)return {lane:'value',edge,price,score};
    if(score>=90&&(price===null||price<=1.55))return {lane:'safe',edge,price,score};
    return null;
  }

  function build(){
    if(!Engine)return {safe:[],value:[],pool:0};
    const pool=matches();
    const rows=[];
    for(const group of ['double','goals','btts','result']){
      Engine.buildEdgeRows(pool,group).forEach(row=>rows.push(row));
    }
    pool.forEach(m=>{
      goalsExtra(m).forEach(extra=>{
        extra.match=m;
        extra.h=Engine.sideProfile(m,'home');
        extra.a=Engine.sideProfile(m,'away');
        rows.push(extra);
      });
    });
    const byMatch=new Map();
    rows.forEach(row=>{
      const m=row.match;if(!m)return;
      const key=String(m.id!=null?m.id:`${m.home}|${m.away}|${dateOf(m)}`);
      const tagged=laneFor(row);if(!tagged)return;
      const pack={...row,...tagged,key,why:explain({...row,...tagged})};
      const old=byMatch.get(key);
      const rank=r=>(r.lane==='safe'?r.score*2:r.score)+(r.edge||0)*20;
      if(!old||rank(pack)>rank(old))byMatch.set(key,pack);
    });
    const safe=[],value=[];
    [...byMatch.values()].sort((a,b)=>b.score-a.score).forEach(row=>{
      if(row.lane==='safe'&&safe.length<8)safe.push(row);
      else if(row.lane==='value'&&value.length<8)value.push(row);
    });
    safe.sort((a,b)=>(a.odds||9)-(b.odds||9));
    value.sort((a,b)=>(b.edge||0)-(a.edge||0));
    return {safe,value,pool:pool.length};
  }

  function card(row,idx){
    const m=row.match;
    return `<article class="p2u-bankers-card">
      <div class="p2u-bankers-card-top">
        <div><h3>${esc(m.home)} vs ${esc(m.away)}</h3><small>${esc(m.league||'Football')} · ${esc(displayTime(m)||dateOf(m))}</small></div>
        <div class="p2u-bankers-price"><b>${fmt(row.odds)}</b><em>${row.lane==='safe'?'SAFE':'VALUE'} · ${Math.round(row.score)}</em></div>
      </div>
      <div class="p2u-bankers-pick"><span>${row.lane==='safe'?'SAFEST MARKET':'VALUE MARKET'}</span><strong>${esc(row.market)}</strong></div>
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
    const sel=$('bankers-league');if(!sel||sel.dataset.ready==='1')return;
    const leagues=[...new Set(pool.map(m=>m.league).filter(Boolean))].sort();
    leagues.forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;sel.appendChild(o);});
    sel.dataset.ready='1';
  }

  function render(){
    const {safe,value,pool}=build();
    fillLeagues((Array.isArray(window.MATCHES)?window.MATCHES:[]).filter(unresolved));
    if($('bankers-meta'))$('bankers-meta').textContent=`${pool} upcoming fixtures in this window · ${safe.length} safest · ${value.length} value`;
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
  }

  function init(){
    if($('bankers-window'))$('bankers-window').addEventListener('change',e=>{state.window=e.target.value;render();});
    if($('bankers-league'))$('bankers-league').addEventListener('change',e=>{state.league=e.target.value;render();});
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
