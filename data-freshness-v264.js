/* Predict2U v264 — public-pick freshness gate. */
(function(root){
  'use strict';
  const DAY=86400000;
  const dateOf=m=>String(m&&m.matchDate||m&&m.kickoff||'').slice(0,10);
  const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'');
  const parse=d=>valid(d)?new Date(d+'T23:59:59Z').getTime():NaN;
  function inspect(matches){
    const now=Date.now();
    const dates=(matches||[]).map(dateOf).filter(valid).sort();
    const maxDate=(root.P2U_DATA_META&&root.P2U_DATA_META.maxFixtureDate)||dates[dates.length-1]||null;
    const sourceUpdated=(root.P2U_DATA_META&&root.P2U_DATA_META.sourceUpdatedAt)||root.DATA_UPDATED||null;
    const generatedAge=sourceUpdated?Math.max(0,(now-new Date(sourceUpdated).getTime())/3600000):null;
    const fixtureAge=maxDate?Math.max(0,(now-parse(maxDate))/DAY):null;
    const hasTodayOrFuture=dates.some(d=>parse(d)>=new Date(new Date().toISOString().slice(0,10)+'T00:00:00Z').getTime());
    const missingUpdate=!sourceUpdated||!Number.isFinite(new Date(sourceUpdated).getTime());
    const blocked=missingUpdate||!hasTodayOrFuture||(fixtureAge!==null&&fixtureAge>1.25)||(generatedAge!==null&&generatedAge>36);
    const reason=missingUpdate?'The data refresh timestamp is unavailable.':!hasTodayOrFuture?'No current or future fixtures are loaded.':fixtureAge!==null&&fixtureAge>1.25?`Latest fixture date is ${maxDate}.`:generatedAge!==null&&generatedAge>36?'The data refresh is older than 36 hours.':'';
    return {blocked,reason,maxDate,sourceUpdated,missingUpdate,generatedAgeHours:generatedAge,fixtureAgeDays:fixtureAge,hasTodayOrFuture};
  }
  function humanTime(value){
    if(!value)return'unknown';
    try{return new Date(value).toLocaleString([],{dateStyle:'medium',timeStyle:'short'});}catch(_){return value;}
  }
  function mount(status){
    let host=document.getElementById('p2u-data-freshness');
    if(!host){host=document.createElement('aside');host.id='p2u-data-freshness';host.className='p2u-data-freshness';host.setAttribute('role','status');document.body.prepend(host);}
    host.classList.toggle('is-blocked',status.blocked);
    host.innerHTML=status.blocked
      ? `<strong>Predictions temporarily paused</strong><span>${status.reason} The site will resume publishing after the next successful data refresh.</span><small>Last data update: ${humanTime(status.sourceUpdated)}</small>`
      : `<strong>Data current</strong><span>Fixtures and prediction inputs are within the publishing window.</span><small>Updated ${humanTime(status.sourceUpdated)}</small>`;
    document.documentElement.dataset.p2uDataState=status.blocked?'stale':'fresh';
  }
  const api={inspect,canPublish:()=>!api.status.blocked,status:inspect(root.MATCHES||[]),mount};
  root.P2UDataFreshness=api;
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mount(api.status));else mount(api.status);
  }
})(typeof window!=='undefined'?window:globalThis);
