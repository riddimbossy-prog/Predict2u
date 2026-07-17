(function(){
  'use strict';
  const host=document.getElementById('engine-bankers-v249');
  const X=window.P2UEngineExperience;
  if(!host||!X)return;
  const esc=value=>String(value==null?'':value).replace(/[<>&"]/g,ch=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[ch]));
  const today=new Date().toISOString().slice(0,10);
  const matches=Array.isArray(window.MATCHES)?window.MATCHES:[];
  const registry=(window.P2U_ENGINE_REGISTRY||[]).filter(engine=>typeof window[engine.fn]==='function');
  let family='all';
  const short=market=>String(market||'').replace(/ Goals$/,'').replace('Home Team ','Home ').replace('Away Team ','Away ');
  const packs=registry.map(engine=>({engine,picks:X.topPicks(matches,engine,today,3),all:X.runEngine(matches,engine,today)})).filter(pack=>pack.picks.length);
  function render(){
    const visible=packs.filter(pack=>family==='all'||pack.engine.family===family);
    host.innerHTML=`<div class="p2u-engine-accas-head"><div><div class="t-lbl" style="color:var(--em)">TODAY'S ENGINE ACCAS</div><h2>Top 2–3 picks from each engine</h2><p>Each active engine gets its own branded mini-acca. Engines with fewer qualifiers show only what passed.</p></div><a href="all-engines.html" class="text-[12px] font-semibold" style="color:var(--em)">Open all engines →</a></div>
      <div class="p2u-engine-acca-filters" role="group" aria-label="Engine family filter">${[['all','All'],['PurePPG','PurePPG'],['Specialist','Specialists'],['Multi-Engine','Multi-Engine']].map(([key,label])=>`<button class="p2u-engine-acca-filter${key===family?' is-active':''}" data-family="${key}">${label}</button>`).join('')}</div>
      <div class="p2u-engine-acca-grid">${visible.length?visible.map(pack=>{
        const colour=X.paletteFor(pack.engine.key)[0];let combined=1,priced=0;pack.picks.forEach(p=>{if(p.odd){combined*=p.odd;priced++;}});
        return `<article class="p2u-engine-pack" style="--pack-accent:${colour}"><div class="p2u-engine-pack-head"><div class="p2u-engine-pack-brand"><span class="p2u-engine-pack-mark">${esc(X.initials(pack.engine.name))}</span><div><h3>${esc(pack.engine.name)}</h3><small>${esc(pack.engine.family)} · ${pack.picks.length} top pick${pack.picks.length===1?'':'s'} · ${pack.all.length} qualified</small></div></div><a class="p2u-engine-pack-open" href="engine.html?engine=${encodeURIComponent(pack.engine.key)}">OPEN →</a></div>
          <div class="p2u-engine-pack-list">${pack.picks.map((pick,index)=>`<div class="p2u-engine-pack-leg"><span class="p2u-engine-pack-no">${index+1}</span><div><div class="p2u-engine-pack-teams">${esc(pick.match.home)} v ${esc(pick.match.away)}</div><div class="p2u-engine-pack-meta">${esc(pick.match.league||'')} · ${pick.banker?'Banker':'Top qualified'} · ${pick.confidence.toFixed(1)}/10</div></div><span class="p2u-engine-pack-market">${esc(short(pick.market))}${pick.odd?` · ${pick.odd.toFixed(2)}`:''}</span></div>`).join('')}</div>
          <div class="p2u-engine-pack-foot"><small>${priced===pack.picks.length?`Combined ${combined.toFixed(2)}`:`${priced}/${pack.picks.length} odds available`}</small><button type="button" class="p2u-engine-pack-add" data-pack="${encodeURIComponent(pack.engine.key)}">Add all ${pack.picks.length}</button></div></article>`;
      }).join(''):'<div class="p2u-engine-pack-empty"><strong>No engine picks today</strong>No engine passed its rules for today’s fixtures.</div>'}</div>`;
    host.querySelectorAll('[data-family]').forEach(button=>button.addEventListener('click',()=>{family=button.dataset.family;render();}));
    host.querySelectorAll('[data-pack]').forEach(button=>button.addEventListener('click',()=>{
      const key=decodeURIComponent(button.dataset.pack);const pack=packs.find(item=>item.engine.key===key);const slip=window.P2USlip;
      if(!pack||!slip){button.textContent='Reload to use My Slip';return;}
      const result=slip.addMany(pack.picks.map(p=>({m:p.match,market:p.market,engine:pack.engine.name})),pack.engine.name);
      const old=button.textContent;button.textContent=result.added?`Added ${result.added}`:'Already added';setTimeout(()=>button.textContent=old,1200);
      if(typeof slip.open==='function')slip.open();
    }));
  }
  render();
})();
