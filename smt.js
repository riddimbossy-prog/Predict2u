/* Predict2U v291 — SMT Similar Market Tips board. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({"&":"&","<":"<",">":">",'"':'"',"'":'&#39;'}[c]));
  const fmt=v=>v==null||!Number.isFinite(Number(v))?'—':Number(v).toFixed(2);
  const pct=v=>v==null?'—':`${Math.round(v*100)}%`;
  const today=new Date().toISOString().slice(0,10);
  const MARKETS=[
    {id:'all',label:'All markets'},
    {id:'OVER15',label:'Over 1.5'},
    {id:'OVER25',label:'Over 2.5'},
    {id:'OVER35',label:'Over 3.5'},
    {id:'UNDER25',label:'Under 2.5'},
    {id:'BTTS_YES',label:'BTTS Yes'},
    {id:'BTTS_NO',label:'BTTS No'},
    {id:'HOME_WIN',label:'Home win'},
    {id:'AWAY_WIN',label:'Away win'},
    {id:'DC1X',label:'1X'},
    {id:'DCX2',label:'X2'}
  ];
  let market='all',date='all',league='all',klass='all',query='';

  function classLabel(c){
    return c==='similar'?'Similar strength':c==='home-stronger'?'Home stronger':c==='away-stronger'?'Away stronger':'Unranked';
  }
  function friendlyDate(d){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d||''))return d||'';
    const label=new Intl.DateTimeFormat(undefined,{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${d}T00:00:00Z`));
    return d===today?`Today · ${label}`:label;
  }
  function loadRows(){
    if(Array.isArray(window.P2U_SMT)&&window.P2U_SMT.length)return window.P2U_SMT.slice();
    const api=window.P2USimilarStrengthV290;
    const matches=Array.isArray(window.MATCHES)?window.MATCHES:[];
    if(api&&typeof api.buildSmtRows==='function'&&matches.some(m=>m&&m.peerIntel))return api.buildSmtRows(matches,today);
    return[];
  }
  const allRows=loadRows();

  function filtered(){
    const q=query.trim().toLowerCase();
    return allRows.filter(row=>{
      if(market!=='all'&&row.id!==market)return false;
      if(date!=='all'&&row.date!==date)return false;
      if(league!=='all'&&row.league!==league)return false;
      if(klass!=='all'&&row.class!==klass)return false;
      if(q&&!`${row.home} ${row.away} ${row.league} ${row.market}`.toLowerCase().includes(q))return false;
      return true;
    });
  }
  function evidenceLine(e){
    const miss=e.hit?'' :' is-miss';
    const mark=e.hit?'✓':'–';
    return `<li class="${miss}"><span>${esc(e.d||'')}</span><span class="p2u-smt-hit">${mark}</span><span>${esc(e.team||'')} ${e.v==='A'?'(A)':'(H)'} vs ${esc(e.opp||'unknown')}</span><em>${e.gf}-${e.ga} ${e.res||''}</em></li>`;
  }
  function card(row,i){
    const rank=row.homeRank&&row.awayRank&&row.leagueSize?`${row.homeRank} vs ${row.awayRank} of ${row.leagueSize}`:'';
    const evidence=(row.evidence||[]).slice(0,8).map(evidenceLine).join('');
    const lab=`team-rankings.html?mode=lab`;
    return `<article class="p2u-smt-card" data-class="${esc(row.class||'')}">
      <div class="p2u-smt-kicker"><span>${esc(row.market)}</span><em>${esc(classLabel(row.class))} · ${esc(friendlyDate(row.date))}</em></div>
      <div>
        <h3>${esc(row.home)} <i>vs</i> ${esc(row.away)}</h3>
        <p class="p2u-smt-meta">${esc(row.league)}${row.country?` · ${esc(row.country)}`:''}${rank?` · ${esc(rank)}`:''}${row.homePpg!=null&&row.awayPpg!=null?` · ${fmt(row.homePpg)} vs ${fmt(row.awayPpg)} PPG`:''}</p>
      </div>
      <div class="p2u-smt-tip">
        <span>SUSPECTED TIP</span>
        <strong>${esc(row.market)}</strong>
        <p>${esc(row.note||'Landed often enough against this strength band.')}</p>
        <div class="p2u-smt-tip-stats">
          <b>${pct(row.rate)} hit rate</b>
          <b>${row.hits||0}/${row.sample||0} sample</b>
          <b>Odds ${fmt(row.odds)}</b>
        </div>
      </div>
      <div class="p2u-smt-evidence">
        <h4>Evidence vs similar strength</h4>
        <ul>${evidence||'<li class="is-miss"><span></span><span class="p2u-smt-hit">–</span><span>Unique historical opponents were not recovered for this band.</span></li>'}</ul>
      </div>
      <div class="p2u-smt-actions">
        <button type="button" class="p2u-smt-add" data-smt-add="${i}">+ Add to Slip</button>
        <a class="p2u-smt-lab" href="${lab}">Open Matchup Lab</a>
      </div>
    </article>`;
  }
  function populateFilters(){
    const chips=$('smt-market-chips');
    if(chips)chips.innerHTML=MARKETS.map(m=>`<button type="button" data-smt-market="${m.id}" class="${market===m.id?'is-active':''}">${esc(m.label)}</button>`).join('');
    const dates=[...new Set(allRows.map(r=>r.date).filter(Boolean))].sort();
    const leagues=[...new Set(allRows.map(r=>r.league).filter(Boolean))].sort();
    const dateSel=$('smt-date'),leagueSel=$('smt-league');
    if(dateSel)dateSel.innerHTML='<option value="all">All dates</option>'+dates.map(d=>`<option value="${esc(d)}">${esc(friendlyDate(d))}</option>`).join('');
    if(leagueSel)leagueSel.innerHTML='<option value="all">All leagues</option>'+leagues.map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join('');
    if(dateSel)dateSel.value=dates.includes(date)?date:'all';
    if(leagueSel)leagueSel.value=leagues.includes(league)?league:'all';
  }
  function render(){
    const rows=filtered();
    const meta=window.P2U_SMT_META||{};
    $('smt-count').textContent=`${rows.length} tip${rows.length===1?'':'s'}`;
    $('smt-title').textContent=market==='all'?'Suspected tips':(MARKETS.find(m=>m.id===market)||{}).label||'Suspected tips';
    const windowCopy=$('smt-window');
    if(windowCopy)windowCopy.textContent=allRows.length
      ?`${allRows.length} similar-market tips from uniquely paired results · ${meta.generatedAt?new Date(meta.generatedAt).toLocaleString():'live board'}`
      :'No similar-market tips yet. The board fills when historical opponents can be uniquely paired.';
    $('smt-copy').textContent=rows.length
      ?'Evidence is the actual scorelines against sides in the same PPG / rank band. The suspected tip is the market that cleared four-plus of those games.'
      :'No row cleared four uniquely paired games in this filter.';
    $('smt-grid').innerHTML=rows.length?rows.slice(0,120).map((row,i)=>card(row,i)).join(''):'<div class="p2u-team-rank-empty">No similar-market tip passed the sample floor for this filter.</div>';
    document.querySelectorAll('[data-smt-add]').forEach(btn=>{
      btn.onclick=()=>{
        const row=rows[Number(btn.dataset.smtAdd)];
        if(!row||!window.P2USlip)return;
        const m={id:row.fixtureId,home:row.home,away:row.away,league:row.league,matchDate:row.date,kickoff:row.kickoff,odds:row.odds!=null?{[row.id]:row.odds}:undefined};
        window.P2USlip.add(m,row.settle||row.market,'SMT Similar Market Tips');
      };
    });
    document.querySelectorAll('[data-smt-market]').forEach(b=>{
      b.classList.toggle('is-active',b.dataset.smtMarket===market);
      b.onclick=()=>{market=b.dataset.smtMarket;render();};
    });
  }
  function init(){
    populateFilters();
    if($('smt-date'))$('smt-date').onchange=e=>{date=e.target.value;render();};
    if($('smt-league'))$('smt-league').onchange=e=>{league=e.target.value;render();};
    if($('smt-class'))$('smt-class').onchange=e=>{klass=e.target.value;render();};
    if($('smt-search'))$('smt-search').oninput=e=>{query=String(e.target.value||'');render();};
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
