/* Predict2U v277 — Market Intelligence UI for Power Rankings. */
(function(){
  'use strict';
  const Engine=window.P2UMarketIntelligenceV277;
  if(!Engine)return;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);
  const fmt=v=>{const n=num(v);return n===null?'—':n.toFixed(2);};
  const metricValue=(label,v)=>{
    const n=num(v);if(n===null)return'—';
    if(/rate|win|loss|draw|unbeaten|o\d|u\d|scores|concedes|support|gg|ng|home|away|no draw/i.test(label)&&n>=0&&n<=1)return `${Math.round(n*100)}%`;
    return Math.abs(n)<10?n.toFixed(2):String(Math.round(n));
  };
  const terminal=new Set(['FT','AET','PEN','PST','CANC','ABD','AWD','WO']);
  const unresolved=m=>m&&m.homeGoals==null&&!terminal.has(String(m.status||'').toUpperCase());
  const preKickoff=m=>{const t=Date.parse(m&&m.kickoff||'');return !Number.isFinite(t)||t>Date.now()+10*60000;};
  const allMatches=()=>Array.isArray(window.MATCHES)?window.MATCHES:[];

  const params=new URLSearchParams(location.search);const state={mode:params.get('intelligence')==='teams'?'teams':'markets',group:params.get('market')&&['best','result','double','goals','btts','firsthalf'].includes(params.get('market'))?params.get('market'):'double',view:params.get('view')==='season'?'season':'edge'};
  const groupLabels={best:'Best',result:'Result',double:'Double Chance',goals:'Goals',btts:'GG / NG',firsthalf:'1st Half'};
  let edgeRegistry=new Map();

  function selectedDate(){return $('team-date-filter')&&$('team-date-filter').value||'all';}
  function selectedLeague(){return $('team-rank-league')&&$('team-rank-league').value||'all';}
  function query(){return String($('team-rank-search')&&$('team-rank-search').value||'').trim().toLowerCase();}
  function fixturePool(){
    const date=selectedDate();
    return allMatches().filter(unresolved).filter(m=>date==='all'||Engine.dateOf(m)===date);
  }
  function edgePool(){return fixturePool().filter(preKickoff);}

  function setUrl(){
    const url=new URL(location.href);url.searchParams.set('intelligence',state.mode);url.searchParams.set('view',state.view);
    if(state.mode==='markets')url.searchParams.set('market',state.group);else url.searchParams.delete('market');
    history.replaceState(null,'',url);
  }

  function injectControls(){
    const toolbar=document.querySelector('.p2u-team-rank-toolbar');if(!toolbar||document.querySelector('[data-intelligence-switch]'))return;
    const switcher=document.createElement('div');
    switcher.className='p2u-control-cluster p2u-intelligence-switch';
    switcher.setAttribute('data-intelligence-switch','true');
    switcher.innerHTML='<span class="p2u-control-label">Intelligence</span><div class="p2u-team-rank-view" role="group" aria-label="Intelligence type"><button type="button" data-intelligence="teams">Teams</button><button type="button" data-intelligence="markets">Markets</button></div>';
    const categoryCluster=toolbar.querySelector('.p2u-control-cluster-grow');
    toolbar.insertBefore(switcher,categoryCluster||toolbar.lastChild);

    const marketCluster=document.createElement('div');
    marketCluster.className='p2u-control-cluster p2u-control-cluster-grow p2u-market-category-cluster';
    marketCluster.hidden=true;
    marketCluster.innerHTML=`<span class="p2u-control-label">Market</span><div class="p2u-team-rank-tabs p2u-market-tabs" role="tablist" aria-label="Prediction market category">${Object.entries(groupLabels).map(([k,v])=>`<button type="button" data-market-group="${k}">${esc(v)}</button>`).join('')}</div>`;
    if(categoryCluster)toolbar.insertBefore(marketCluster,categoryCluster.nextSibling);else toolbar.appendChild(marketCluster);

    const note=document.createElement('div');note.className='p2u-market-rule-strip';note.id='p2u-market-rule-strip';note.hidden=true;
    note.innerHTML='<span><b>82+</b> Strong Edge</span><span><b>90+</b> Elite Edge</span>';
    const controls=document.querySelector('.p2u-team-rank-controls');if(controls)controls.appendChild(note);

    document.querySelectorAll('[data-intelligence]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.intelligence)));
    document.querySelectorAll('[data-market-group]').forEach(b=>b.addEventListener('click',()=>{state.group=b.dataset.marketGroup;setUrl();renderMarkets();syncControls();}));
  }

  function syncControls(){
    document.querySelectorAll('[data-intelligence]').forEach(b=>b.classList.toggle('is-active',b.dataset.intelligence===state.mode));
    document.querySelectorAll('[data-market-group]').forEach(b=>b.classList.toggle('is-active',b.dataset.marketGroup===state.group));
    const nativeCategory=document.querySelector('.p2u-team-rank-toolbar .p2u-control-cluster-grow:not(.p2u-market-category-cluster)');
    const marketCategory=document.querySelector('.p2u-market-category-cluster');
    const polarity=document.querySelector('.p2u-team-polarity-cluster');
    if(nativeCategory)nativeCategory.hidden=state.mode==='markets';
    if(marketCategory)marketCategory.hidden=state.mode!=='markets';
    if($('p2u-market-rule-strip'))$('p2u-market-rule-strip').hidden=state.mode!=='markets';
    if(state.mode==='markets'&&polarity)polarity.hidden=true;
    document.body.classList.toggle('p2u-market-intelligence-active',state.mode==='markets');
  }

  function setMode(mode){
    if(mode!=='teams'&&mode!=='markets')return;state.mode=mode;setUrl();syncControls();
    if(mode==='markets')renderMarkets();
    else{
      const active=document.querySelector(`[data-rank-view="${state.view}"]`)||document.querySelector('[data-rank-view].is-active');
      if(active)active.click();
    }
  }

  function displayTime(m){
    const raw=m&&m.kickoff;if(!raw)return'';const d=new Date(raw);if(Number.isNaN(d.getTime()))return String(raw).slice(11,16);
    return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});
  }

  function gradeBadge(score){const elite=score>=Engine.ELITE;return `<span class="p2u-market-grade ${elite?'is-elite':'is-strong'}"><small>${elite?'ELITE EDGE':'STRONG EDGE'}</small><b>${Math.round(score)}</b></span>`;}

  function metricCards(metrics){
    return `<div class="p2u-market-metrics">${(metrics||[]).slice(0,3).map(([label,value])=>`<span><small>${esc(label)}</small><b>${esc(metricValue(label,value))}</b></span>`).join('')}</div>`;
  }

  function edgeCard(row,key){
    const m=row.match,price=row.odds;
    return `<article class="p2u-market-card is-edge" data-market-fixture="${esc(key)}">
      <div class="p2u-market-card-top"><div><span>${esc(m.league||'Football')}</span><small>${esc(Engine.dateOf(m))}${displayTime(m)?` · ${esc(displayTime(m))}`:''}</small></div>${gradeBadge(row.score)}</div>
      <div class="p2u-market-match"><strong>${esc(m.home)}</strong><i>vs</i><strong>${esc(m.away)}</strong></div>
      <div class="p2u-market-pick"><span>NEXT MATCH MARKET</span><h3>${esc(row.market)}</h3><div><b>Odds ${price?fmt(price):'—'}</b><b>${esc(groupLabels[row.group]||row.group)}</b></div></div>
      ${metricCards(row.metrics)}
      <ul class="p2u-market-reasons">${(row.reasons||[]).slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      <div class="p2u-market-actions"><button type="button" data-market-slip="${esc(key)}">+ Add to Slip</button></div>
    </article>`;
  }

  function seasonCard(row){
    const p=row.profile,price=Engine.oddsValue(p.fixture,row.oddsKey);
    return `<article class="p2u-market-card is-season">
      <div class="p2u-market-card-top"><div><span>${esc(p.league)}</span><small>${p.side==='home'?'HOME SPLIT':'AWAY SPLIT'} · ${p.games} matches</small></div>${gradeBadge(row.score)}</div>
      <div class="p2u-market-season-team"><h3>${esc(p.team)}</h3></div>
      <div class="p2u-market-pick"><span>SEASON MARKET POWER</span><h3>${esc(row.market)}</h3><div><b>Odds ${price?fmt(price):'—'}</b><b>${esc(groupLabels[row.group]||row.group)}</b></div></div>
      ${metricCards(row.metrics)}
      <ul class="p2u-market-reasons">${(row.reasons||[]).slice(0,2).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    </article>`;
  }

  function filteredRows(rows,view){
    const league=selectedLeague(),q=query();
    return rows.filter(row=>{
      const m=view==='edge'?row.match:row.profile&&row.profile.fixture;
      const home=m&&m.home||'',away=m&&m.away||'',rowLeague=m&&m.league||row.profile&&row.profile.league||'';
      if(league!=='all'&&rowLeague!==league)return false;
      if(q&&!`${home} ${away} ${row.market} ${rowLeague} ${m&&m.country||''}`.toLowerCase().includes(q))return false;
      return true;
    });
  }

  function renderMarkets(){
    if(state.mode!=='markets')return;
    const activeView=document.querySelector('[data-rank-view].is-active');if(activeView)state.view=activeView.dataset.rankView||state.view;
    const pool=state.view==='edge'?edgePool():fixturePool();
    let rows=state.view==='edge'?Engine.buildEdgeRows(pool,state.group):Engine.buildSeasonRows(pool,state.group);
    rows=filteredRows(rows,state.view);
    const title=state.view==='edge'?`${groupLabels[state.group]} Market Edges`:`${groupLabels[state.group]} Season Market Power`;
    if($('team-rank-title'))$('team-rank-title').textContent=title;
    if($('team-rank-copy'))$('team-rank-copy').textContent='';
    if($('team-rank-count'))$('team-rank-count').textContent=`${rows.length} qualified`;
    edgeRegistry=new Map();
    if(state.view==='edge')rows.forEach((row,i)=>edgeRegistry.set(String(i),row));
    if($('team-rank-grid')){
      $('team-rank-grid').classList.add('p2u-market-intelligence-grid');
      $('team-rank-grid').innerHTML=rows.length
        ?rows.slice(0,100).map((r,i)=>state.view==='edge'?edgeCard(r,String(i)):seasonCard(r)).join('')
        :'<div class="p2u-team-rank-empty">No edges for this filter.</div>';
    }
    document.querySelectorAll('[data-market-slip]').forEach(button=>button.onclick=()=>addToSlip(button.dataset.marketSlip));
    syncControls();
  }

  function addToSlip(key){
    const row=edgeRegistry.get(String(key));if(!row||!window.P2USlip)return;
    window.P2USlip.add(row.match,row.canonical,'Market Intelligence');
    if(typeof window.P2USlip.open==='function')window.P2USlip.open();
  }

  function bindExistingControls(){
    document.querySelectorAll('[data-rank-view]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.rankView||'edge';setUrl();if(state.mode==='markets')setTimeout(renderMarkets,0);}));
    if($('team-rank-league'))$('team-rank-league').addEventListener('change',()=>{if(state.mode==='markets')setTimeout(renderMarkets,0);});
    if($('team-rank-search'))$('team-rank-search').addEventListener('input',()=>{if(state.mode==='markets')setTimeout(renderMarkets,0);});
    if($('team-date-filter'))$('team-date-filter').addEventListener('change',()=>{if(state.mode==='markets')setTimeout(renderMarkets,0);});
  }

  function init(){
    injectControls();bindExistingControls();
    const requested=new URLSearchParams(location.search).get('market');if(requested&&groupLabels[requested])state.group=requested;
    const viewButton=document.querySelector(`[data-rank-view="${state.view}"]`);if(viewButton&&!viewButton.classList.contains('is-active'))viewButton.click();
    syncControls();if(state.mode==='markets')renderMarkets();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
