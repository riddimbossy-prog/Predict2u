/* Predict2U v277 — Market Profile Intelligence (analysis/simulation only). */
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[char]));
  const num=value=>value===null||value===undefined||value===''||!Number.isFinite(Number(value))?null:Number(value);
  const first=(...values)=>{for(const value of values){const n=num(value);if(n!==null)return n;}return null;};
  const rate=value=>{const n=num(value);return n===null?null:(n>1.00001?n/100:n);};
  const pct=value=>value===null?'—':`${Math.round(Math.max(0,Math.min(1,value))*100)}%`;
  const dateOf=match=>String(match&&match.matchDate||match&&match.kickoff||'').slice(0,10);
  const terminal=new Set(['FT','AET','PEN','PST','CANC','ABD','AWD','WO']);
  const unresolved=match=>match&&match.homeGoals==null&&!terminal.has(String(match.status||'').toUpperCase());
  const matches=Array.isArray(window.MATCHES)?window.MATCHES:[];
  const MIN_SAMPLE=8;

  function profile(match,side){
    const isHome=side==='home';
    const streaks=match&&match[`${side}Streaks`]||{};
    const htft=streaks.htft||{};
    const advanced=streaks.advanced||{};
    const teamProfile=match&&match[`${side}Profile`]||{};
    const games=first(match&&match[`${side}VenueGames`],advanced.samples&&advanced.samples.splitVenue,htft.ftSample,streaks.sample,teamProfile.games);
    const win=rate(first(match&&match[`${side}WinRate`],htft.ftWin));
    const draw=rate(first(htft.ftDraw));
    const unbeaten=rate(first(match&&match[`${side}UnbeatenRate`],win!==null&&draw!==null?win+draw:null));
    const loss=rate(first(htft.ftLoss,unbeaten!==null?1-unbeaten:null));
    const over15=rate(first(match&&match[`${side}Over15Rate`]));
    const over25=rate(first(match&&match[`${side}Over25Rate`]));
    const over35=rate(first(match&&match[`${side}Over35Rate`]));
    const btts=rate(first(htft.ftBtts));
    const cleanSheet=rate(first(match&&match[`${side}CleanSheetRate`],htft.ftCS));
    const failedToScore=rate(first(match&&match[`${side}FailedToScoreRate`],htft.ftFTS));
    return {
      fixture:match,
      side,
      team:match&&match[side]||'',
      opponent:match&&match[isHome?'away':'home']||'',
      league:match&&match.league||'Unknown league',
      country:match&&match.country||'',
      logo:match&&match[`${side}Logo`]||'',
      games,
      matchDate:dateOf(match),
      kickoff:match&&match.kickoff||'',
      win,
      loss,
      unbeaten,
      over15,
      over25,
      under35:over35===null?null:1-over35,
      btts,
      noBtts:btts===null?null:1-btts,
      scored:failedToScore===null?null:1-failedToScore,
      failedToScore,
      cleanSheet,
      conceded:cleanSheet===null?null:1-cleanSheet
    };
  }

  function validProfile(row){return row.team&&row.games!==null&&row.games>=MIN_SAMPLE;}
  function selectedMatches(){
    const selected=$('team-date-filter')&&$('team-date-filter').value||'all';
    return matches.filter(unresolved).filter(match=>selected==='all'||dateOf(match)===selected);
  }
  function matchupRows(){
    return selectedMatches().map(match=>({match,home:profile(match,'home'),away:profile(match,'away')})).filter(row=>validProfile(row.home)&&validProfile(row.away));
  }
  function seasonRows(){
    const map=new Map();
    for(const match of selectedMatches()){
      for(const side of ['home','away']){
        const row=profile(match,side);
        if(!validProfile(row))continue;
        const key=`${row.league}|${row.team}|${row.side}`;
        const current=map.get(key);
        if(!current||String(row.matchDate)>String(current.matchDate)||(row.games||0)>(current.games||0))map.set(key,row);
      }
    }
    return [...map.values()];
  }

  const categories={
    goals:{label:'Goals',copy:'Historical venue frequencies for common goal-line outcomes.',metrics:[['Over 1.5','over15'],['Over 2.5','over25'],['Under 3.5','under35']]},
    btts:{label:'GG / NG',copy:'Historical both-teams-to-score and no-BTTS venue frequencies.',metrics:[['GG','btts'],['NG','noBtts']]},
    result:{label:'Result tendencies',copy:'Historical venue win, unbeaten and loss frequencies. These are descriptive profiles, not match recommendations.',metrics:[['Win rate','win'],['Unbeaten','unbeaten'],['Loss rate','loss']]},
    scoring:{label:'Team scoring',copy:'Historical scoring, clean-sheet and concession frequencies for each venue split.',metrics:[['Scores','scored'],['Fails to score','failedToScore'],['Clean sheet','cleanSheet'],['Concedes','conceded']]}
  };

  let view='match';
  let category='goals';
  let league='all';
  let query='';

  function timeOf(match){
    const parsed=Date.parse(match&&match.kickoff||'');
    if(!Number.isFinite(parsed))return '';
    return new Date(parsed).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});
  }
  function metricCells(home,away){
    return categories[category].metrics.map(([label,key])=>`<div class="p2u-market-metric"><span>${esc(label)}</span><b>${esc(pct(home[key]))}</b><b>${esc(pct(away[key]))}</b></div>`).join('');
  }
  function matchupCard(row){
    const h=row.home,a=row.away,m=row.match;
    return `<article class="p2u-market-profile-card">
      <div class="p2u-market-profile-top"><span>${esc(h.league)}</span><span>${esc(h.matchDate)}${timeOf(m)?` · ${esc(timeOf(m))}`:''}</span></div>
      <div class="p2u-market-team-head"><div><strong>${esc(h.team)}</strong><small>Home split · ${esc(h.games)} matches</small></div><span>vs</span><div><strong>${esc(a.team)}</strong><small>Away split · ${esc(a.games)} matches</small></div></div>
      <div class="p2u-market-table-head"><span>Historical metric</span><b>Home</b><b>Away</b></div>
      ${metricCells(h,a)}
      <p class="p2u-market-profile-note">Next-match comparison uses each team’s venue-specific historical sample only.</p>
    </article>`;
  }
  function teamCard(row){
    const metrics=categories[category].metrics.map(([label,key])=>`<span><b>${esc(pct(row[key]))}</b><small>${esc(label)}</small></span>`).join('');
    return `<article class="p2u-market-season-card">
      <div class="p2u-market-season-head">${row.logo?`<img src="${esc(row.logo)}" alt="" loading="lazy">`:''}<div><strong>${esc(row.team)}</strong><small>${esc(row.league)} · ${row.side==='home'?'Home split':'Away split'}</small></div></div>
      <div class="p2u-market-season-metrics">${metrics}</div>
      <div class="p2u-market-season-foot"><span>${esc(row.games)}-match sample</span><span>Next: ${esc(row.opponent||'TBD')}</span></div>
    </article>`;
  }

  function populateLeagues(){
    const select=$('market-profile-league');
    if(!select)return;
    const leagues=[...new Set(selectedMatches().map(match=>match.league).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
    const prior=league;
    select.innerHTML='<option value="all">All leagues</option>'+leagues.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('');
    if(prior!=='all'&&leagues.includes(prior))select.value=prior;else{league='all';select.value='all';}
  }

  function render(){
    const grid=$('market-profile-grid');
    if(!grid)return;
    populateLeagues();
    const text=String(query||'').toLowerCase();
    let rows=view==='match'?matchupRows():seasonRows();
    if(league!=='all')rows=rows.filter(row=>(view==='match'?row.home.league:row.league)===league);
    if(text){
      rows=rows.filter(row=>{
        const hay=view==='match'?`${row.home.team} ${row.away.team} ${row.home.league} ${row.home.country}`:`${row.team} ${row.opponent} ${row.league} ${row.country}`;
        return hay.toLowerCase().includes(text);
      });
    }
    rows.sort((a,b)=>{
      const ad=view==='match'?a.home.matchDate:a.matchDate,bd=view==='match'?b.home.matchDate:b.matchDate;
      const al=view==='match'?a.home.league:a.league,bl=view==='match'?b.home.league:b.league;
      return String(ad).localeCompare(String(bd))||String(al).localeCompare(String(bl));
    });
    $('market-profile-title').textContent=view==='match'?`${categories[category].label} — Next Match Comparison`:`${categories[category].label} — Season Market Profile`;
    $('market-profile-copy').textContent=categories[category].copy;
    $('market-profile-count').textContent=`${rows.length} ${view==='match'?'matchups':'profiles'} · sample ${MIN_SAMPLE}+`;
    grid.innerHTML=rows.length?rows.slice(0,120).map(view==='match'?matchupCard:teamCard).join(''):'<div class="p2u-team-rank-empty">No reliable profiles are available for this filter. No signal is inferred from missing data.</div>';
    document.querySelectorAll('[data-market-profile-view]').forEach(button=>button.classList.toggle('is-active',button.dataset.marketProfileView===view));
    document.querySelectorAll('[data-market-profile-category]').forEach(button=>button.classList.toggle('is-active',button.dataset.marketProfileCategory===category));
  }

  function createPanel(){
    const nav=document.querySelector('.p2u-team-mode-tabs');
    const main=document.querySelector('.p2u-team-rank-page');
    if(!nav||!main||$('team-panel-market-profile'))return;

    const button=document.createElement('button');
    button.type='button';
    button.id='team-market-profile-tab';
    button.textContent='Market Profiles';
    nav.appendChild(button);

    const panel=document.createElement('section');
    panel.id='team-panel-market-profile';
    panel.className='p2u-team-panel p2u-market-profile-panel';
    panel.hidden=true;
    panel.innerHTML=`
      <section class="p2u-market-profile-hero">
        <div><span class="p2u-team-rank-kicker">MARKET PROFILE LAB</span><h2>Extend Team Intelligence across football market categories.</h2><p>Compare venue-specific historical frequencies for upcoming fixtures or inspect each team’s season market profile. This section is for analysis and simulation only; it does not place or recommend bets.</p></div>
        <div class="p2u-market-safety">Analysis / simulation only</div>
      </section>
      <section class="p2u-team-rank-controls p2u-market-profile-controls">
        <div class="p2u-team-rank-toolbar">
          <div class="p2u-control-cluster"><span class="p2u-control-label">View</span><div class="p2u-team-rank-view" role="group" aria-label="Market profile view"><button type="button" class="is-active" data-market-profile-view="match">Next Match Comparison</button><button type="button" data-market-profile-view="season">Season Market Profile</button></div></div>
          <div class="p2u-control-cluster p2u-control-cluster-grow"><span class="p2u-control-label">Category</span><div class="p2u-team-rank-tabs p2u-market-profile-tabs" role="tablist" aria-label="Market profile category"><button type="button" class="is-active" data-market-profile-category="goals">Goals</button><button type="button" data-market-profile-category="btts">GG / NG</button><button type="button" data-market-profile-category="result">Result tendencies</button><button type="button" data-market-profile-category="scoring">Team scoring</button></div></div>
        </div>
        <div class="p2u-team-rank-fields"><label class="p2u-team-field"><span>League</span><select id="market-profile-league"><option value="all">All leagues</option></select></label><label class="p2u-team-field p2u-team-field-grow"><span>Search</span><input id="market-profile-search" type="search" placeholder="Search team, league or country…"></label></div>
      </section>
      <div class="p2u-team-rank-section-head"><div><h2 id="market-profile-title">Goals — Next Match Comparison</h2><p id="market-profile-copy"></p></div><span id="market-profile-count" class="p2u-team-rank-count">0 matchups</span></div>
      <section id="market-profile-grid" class="p2u-market-profile-grid"><div class="p2u-team-rank-empty">Reading venue-specific market profiles…</div></section>`;
    main.appendChild(panel);

    const openMarket=()=>{
      document.querySelectorAll('.p2u-team-mode-tabs button').forEach(tab=>tab.classList.remove('is-active'));
      button.classList.add('is-active');
      document.querySelectorAll('[data-team-panel]').forEach(section=>{section.hidden=true;section.classList.remove('is-active');});
      panel.hidden=false;panel.classList.add('is-active');
      render();
      try{const url=new URL(location.href);url.searchParams.set('mode','market-profile');history.replaceState(null,'',url);}catch(_){}
    };
    button.addEventListener('click',openMarket);
    document.querySelectorAll('[data-team-mode]').forEach(tab=>tab.addEventListener('click',()=>{button.classList.remove('is-active');panel.hidden=true;panel.classList.remove('is-active');}));
    document.querySelectorAll('[data-market-profile-view]').forEach(control=>control.addEventListener('click',()=>{view=control.dataset.marketProfileView;render();}));
    document.querySelectorAll('[data-market-profile-category]').forEach(control=>control.addEventListener('click',()=>{category=control.dataset.marketProfileCategory;render();}));
    $('market-profile-league').addEventListener('change',event=>{league=event.target.value||'all';render();});
    $('market-profile-search').addEventListener('input',event=>{query=String(event.target.value||'').trim();render();});
    if($('team-date-filter'))$('team-date-filter').addEventListener('change',()=>{league='all';render();});

    if(new URLSearchParams(location.search).get('mode')==='market-profile')openMarket();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',createPanel,{once:true});else createPanel();
})();
