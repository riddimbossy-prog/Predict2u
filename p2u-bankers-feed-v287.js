/* Predict2U v287 — Bankers of the Day board. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[c]));
  const num=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);
  const fmt=v=>{const n=num(v);return n===null?'—':n.toFixed(2);};
  const FEED_URL='https://olfoahrqvwrpfesfgjqk.supabase.co/functions/v1/stats2pitch-bankers';
  const FEED_KEY='sb_publishable_xle6S4IZ_djboDdfGfG4Rg_HXPYENZY';
  const ZONE='Africa/Accra';
  const state={window:'today',league:'all',safe:[],value:[],engine:'bankers-v1',generatedAt:null,error:null,loading:true};

  function todayStamp(){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function addDays(stamp,n){
    const d=new Date(stamp+'T12:00:00Z');
    d.setUTCDate(d.getUTCDate()+n);
    return d.toISOString().slice(0,10);
  }
  function datesForWindow(){
    const today=todayStamp();
    if(state.window==='36h')return [today,addDays(today,1)];
    if(state.window==='weekend')return [today,addDays(today,1),addDays(today,2),addDays(today,3)];
    return [today];
  }
  function kickMs(row){
    const t=Date.parse(row&&row.kickoff||'');
    return Number.isFinite(t)?t:null;
  }
  function dateOf(row){return String(row&&row.kickoff||'').slice(0,10);}
  function displayTime(row){
    const t=kickMs(row);if(t===null)return '';
    return new Date(t).toLocaleString([],{weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false});
  }
  function windowOk(row){
    const t=kickMs(row);if(t===null)return false;
    const now=Date.now();
    if(t<now-5*60000)return false;
    if(state.window==='36h')return t<=now+36*3600000;
    if(state.window==='weekend'){
      const d=new Date(t).getUTCDay();
      return t<now+5*86400000&&(d===0||d===5||d===6);
    }
    return dateOf(row)===todayStamp();
  }

  function marketCode(pick){
    const sel=String(pick.selection||'').toLowerCase();
    const market=String(pick.market||'').toLowerCase();
    if(sel==='home'||/to win/i.test(pick.displaySelection||'')&&pick.favourite==='home')return '1';
    if(sel==='away'||pick.favourite==='away'&&/to win/i.test(pick.displaySelection||''))return '2';
    if(sel==='draw')return 'X';
    if(/over 1\.5/.test(sel))return 'O1.5';
    if(/over 2\.5/.test(sel))return 'O2.5';
    if(/under 3\.5/.test(sel))return 'U3.5';
    if(/draw or over/.test(sel))return 'X / O2.5';
    if(market==='match-winner')return sel==='home'?'1':sel==='away'?'2':'1X2';
    return '';
  }
  function oddsKey(pick){
    const sel=String(pick.selection||'').toLowerCase();
    if(sel==='home')return 'home';
    if(sel==='away')return 'away';
    if(sel==='draw')return 'draw';
    if(/over 1\.5/.test(sel)&&pick.family!=='Team Goals')return 'over15';
    if(/over 2\.5/.test(sel))return 'over25';
    if(/under 3\.5/.test(sel))return 'under35';
    return 'home';
  }
  function asMatch(pick){
    const book=pick.oddsBook||{};
    return {
      id:pick.fixtureId,
      home:pick.home,
      away:pick.away,
      league:pick.league,
      country:pick.country,
      kickoff:pick.kickoff,
      matchDate:dateOf(pick),
      sportyEventId:pick.sportyEventId||null,
      odds:{
        home:book.favWin&&pick.favourite==='home'?book.favWin:null,
        away:book.favWin&&pick.favourite==='away'?book.favWin:null,
        draw:book.draw||null,
        over15:book.over15||null,
        over25:book.over25||null,
        under35:book.under35||null
      }
    };
  }
  function asRow(pick,lane){
    const label=pick.displaySelection||pick.pick||pick.selection||'Selection';
    return {
      match:asMatch(pick),
      raw:pick,
      lane,
      odds:num(pick.odds),
      label,
      canonical:label,
      market:label,
      code:marketCode(pick),
      oddsKey:oddsKey(pick),
      why:'',
      score:lane==='safe'?94:88,
      booked:true,
      rule:pick.rule||''
    };
  }

  async function loadDate(date){
    const res=await fetch(`${FEED_URL}?date=${encodeURIComponent(date)}`,{
      headers:{apikey:FEED_KEY,Authorization:`Bearer ${FEED_KEY}`},
      cache:'no-store'
    });
    if(!res.ok)throw new Error('Bankers feed '+res.status);
    return res.json();
  }

  async function loadBoard(){
    state.loading=true;
    state.error=null;
    render();
    try{
      const packs=await Promise.all(datesForWindow().map(d=>loadDate(d).catch(()=>null)));
      const safe=[],value=[],seen=new Set();
      let generatedAt=null;
      for(const pack of packs){
        if(!pack)continue;
        generatedAt=pack.meta?.generatedAt||generatedAt;
        const safest=Array.isArray(pack.safestBankers)?pack.safestBankers:[];
        const values=Array.isArray(pack.valueBankers)?pack.valueBankers:[];
        for(const pick of safest){
          const key=String(pick.fixtureId||pick.home+'|'+pick.away);
          if(seen.has(key))continue;seen.add(key);
          safe.push(asRow(pick,'safe'));
        }
        for(const pick of values){
          const key=String(pick.fixtureId||pick.home+'|'+pick.away);
          if(seen.has(key))continue;seen.add(key);
          value.push(asRow(pick,'value'));
        }
      }
      state.safe=safe.filter(r=>windowOk(r.raw)).filter(r=>state.league==='all'||r.match.league===state.league)
        .sort((a,b)=>(kickMs(a.raw)||0)-(kickMs(b.raw)||0)||(a.odds||99)-(b.odds||99));
      state.value=value.filter(r=>windowOk(r.raw)).filter(r=>state.league==='all'||r.match.league===state.league)
        .sort((a,b)=>(kickMs(a.raw)||0)-(kickMs(b.raw)||0));
      state.generatedAt=generatedAt;
      state.loading=false;
      render();
    }catch(error){
      state.loading=false;
      state.error=error&&error.message?error.message:'Bankers are unavailable.';
      render();
    }
  }

  function card(row,idx){
    const m=row.match;
    return `<article class="p2u-bankers-card is-${row.lane}">
      <div class="p2u-bankers-card-top">
        <div>
          <h3>${esc(m.home)} vs ${esc(m.away)}</h3>
          <small>${esc(m.league||'Football')} · ${esc(displayTime(m)||dateOf(row.raw))}</small>
        </div>
        <div class="p2u-bankers-price">
          <b>${fmt(row.odds)}</b>
          <em>SPORTYBET · ${row.lane==='safe'?'SAFE':'VALUE'}</em>
        </div>
      </div>
      <div class="p2u-bankers-pick">
        <span>${row.code?esc(row.code)+' · ':''}${row.lane==='safe'?'SAFEST MARKET':'VALUE MARKET'}</span>
        <strong>${esc(row.label)}</strong>
      </div>
      <div class="p2u-bankers-actions"><button type="button" data-banker-slip="${row.lane}-${idx}">+ Add to Slip</button></div>
    </article>`;
  }

  function acca(rows){
    const priced=rows.map(r=>num(r.odds)).filter(v=>v&&v>1);
    if(!priced.length)return 'Combined —';
    const total=priced.reduce((a,b)=>a*b,1);
    return `Combined ${fmt(total)} from ${priced.length} priced pick${priced.length===1?'':'s'}`;
  }

  function fillLeagues(){
    const sel=$('bankers-league');if(!sel)return;
    const current=sel.value||'all';
    const pool=[...state.safe,...state.value].map(r=>r.match.league).filter(Boolean);
    const leagues=[...new Set(pool)].sort((a,b)=>a.localeCompare(b));
    sel.innerHTML='<option value="all">All leagues</option>';
    leagues.forEach(name=>{const o=document.createElement('option');o.value=name;o.textContent=name;sel.appendChild(o);});
    sel.value=leagues.includes(current)?current:'all';
    state.league=sel.value;
  }

  function render(){
    const safe=state.safe,value=state.value;
    if(!state.loading)fillLeagues();
    const stamp=state.generatedAt?new Date(state.generatedAt).toLocaleString([],{hour:'2-digit',minute:'2-digit',hour12:false}):'—';
    if($('bankers-meta')){
      if(state.loading)$('bankers-meta').textContent='Reading today’s bankers…';
      else if(state.error)$('bankers-meta').textContent=state.error;
      else $('bankers-meta').textContent=`${safe.length} safest · ${value.length} value · updated ${stamp}`;
    }
    if($('safe-acca'))$('safe-acca').textContent=acca(safe);
    if($('value-acca'))$('value-acca').textContent=acca(value);
    if($('safe-list')){
      if(state.loading)$('safe-list').innerHTML='<div class="p2u-bankers-empty">Scanning safest lines…</div>';
      else if(state.error)$('safe-list').innerHTML=`<div class="p2u-bankers-empty">${esc(state.error)}</div>`;
      else $('safe-list').innerHTML=safe.length?safe.map((row,i)=>card(row,i)).join(''):'<div class="p2u-bankers-empty">No safest banker in this window.</div>';
    }
    if($('value-list')){
      if(state.loading)$('value-list').innerHTML='<div class="p2u-bankers-empty">Scanning value lines…</div>';
      else if(state.error)$('value-list').innerHTML=`<div class="p2u-bankers-empty">${esc(state.error)}</div>`;
      else $('value-list').innerHTML=value.length?value.map((row,i)=>card(row,i)).join(''):'<div class="p2u-bankers-empty">No value banker in this window.</div>';
    }
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
      $('bankers-window').addEventListener('change',e=>{state.window=e.target.value;loadBoard();});
    }
    if($('bankers-league'))$('bankers-league').addEventListener('change',e=>{state.league=e.target.value;loadBoard();});
    loadBoard();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
