/* Predict2U v266 — quiet freshness status. No intrusive pause banner. */
(function(root){
  'use strict';
  const DAY=86400000;
  const dateOf=m=>String(m&&m.matchDate||m&&m.kickoff||'').slice(0,10);
  const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'');
  const parse=d=>valid(d)?new Date(`${d}T23:59:59Z`).getTime():NaN;
  function inspect(matches){
    const now=Date.now(),dates=(matches||[]).map(dateOf).filter(valid).sort();
    const maxDate=(root.P2U_DATA_META&&root.P2U_DATA_META.maxFixtureDate)||dates[dates.length-1]||null;
    const sourceUpdated=(root.P2U_DATA_META&&root.P2U_DATA_META.sourceUpdatedAt)||root.DATA_UPDATED||null;
    const generatedAge=sourceUpdated?Math.max(0,(now-new Date(sourceUpdated).getTime())/3600000):null;
    const fixtureAge=maxDate?Math.max(0,(now-parse(maxDate))/DAY):null;
    const today=new Date().toISOString().slice(0,10),hasTodayOrFuture=dates.some(d=>d>=today);
    const missingUpdate=!sourceUpdated||!Number.isFinite(new Date(sourceUpdated).getTime());
    const stale=missingUpdate||!hasTodayOrFuture||(fixtureAge!==null&&fixtureAge>1.25)||(generatedAge!==null&&generatedAge>36);
    const reason=missingUpdate?'Refresh time unavailable':!hasTodayOrFuture?'No current fixtures loaded':fixtureAge!==null&&fixtureAge>1.25?`Latest fixture ${maxDate}`:generatedAge!==null&&generatedAge>36?'Data refresh pending':'';
    return {blocked:false,stale,reason,maxDate,sourceUpdated,missingUpdate,generatedAgeHours:generatedAge,fixtureAgeDays:fixtureAge,hasTodayOrFuture};
  }
  function mount(status){
    const old=document.getElementById('p2u-data-freshness');if(old)old.remove();
    document.documentElement.dataset.p2uDataState=status.stale?'stale':'fresh';
  }
  const api={inspect,canPublish:()=>true,status:inspect(root.MATCHES||[]),mount};
  root.P2UDataFreshness=api;
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mount(api.status));else mount(api.status);
  }
})(typeof window!=='undefined'?window:globalThis);
