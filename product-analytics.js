/* Predict2U v186 — Admin Product Intelligence dashboard */
(function(){
  'use strict';
  const VERSION='v186';
  let report=null,days=30,loading=false,client=null;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>new Intl.NumberFormat().format(Number(v||0));
  const pct=v=>`${Math.round(Number(v||0)*10)/10}%`;
  const ms=v=>`${Math.round(Number(v||0))} ms`;

  async function getClient(){
    if(client)return client;
    if(window.P2UAccounts&&window.P2UAccounts.getClient){client=await window.P2UAccounts.getClient();return client}
    throw new Error('Cloud client is unavailable.');
  }
  async function rpc(name,args={}){if(window.__P2U_ADMIN_MOCK__&&window.__P2U_ADMIN_MOCK__.rpc)return window.__P2U_ADMIN_MOCK__.rpc(name,args);const sb=await getClient();const {data,error}=await sb.rpc(name,args);if(error)throw error;return data}
  function setState(message,type=''){const el=$('#analytics-state');if(!el)return;el.textContent=message;el.className=`analytics-state ${type}`}
  function setBusy(value){loading=value;$$('[data-analytics-admin-action]').forEach(el=>el.disabled=value)}

  function metric(id,value,sub=''){const el=$(id);if(el)el.innerHTML=`<strong>${esc(value)}</strong>${sub?`<span>${esc(sub)}</span>`:''}`}
  function rows(data,render,empty='No data yet.'){
    if(!Array.isArray(data)||!data.length)return`<tr><td colspan="4"><div class="analytics-empty">${esc(empty)}</div></td></tr>`;
    return data.map(render).join('');
  }
  function bar(value,max){const width=max>0?Math.max(4,Math.min(100,(Number(value||0)/max)*100)):0;return`<span class="analytics-bar"><i style="width:${width}%"></i></span>`}

  function renderTrend(){
    const root=$('#analytics-trend');if(!root)return;const series=report&&report.daily||[];
    if(!series.length){root.innerHTML='<div class="analytics-empty">No daily activity yet.</div>';return}
    const max=Math.max(1,...series.map(x=>Number(x.page_views||0)));
    root.innerHTML=series.map(x=>`<div class="analytics-trend-day" title="${esc(x.day)} · ${number(x.page_views)} views"><span style="height:${Math.max(6,Math.round((Number(x.page_views||0)/max)*100))}%"></span><small>${esc(String(x.day||'').slice(5))}</small></div>`).join('');
  }
  function renderTables(){
    const pages=report&&report.top_pages||[],events=report&&report.top_events||[],entities=report&&report.top_entities||[],devices=report&&report.device_mix||[];
    const pageMax=Math.max(1,...pages.map(x=>Number(x.count||0)));
    const eventMax=Math.max(1,...events.map(x=>Number(x.count||0)));
    $('#analytics-pages-body').innerHTML=rows(pages,x=>`<tr><td>${esc(x.page_path||'—')}</td><td>${number(x.count)}</td><td>${bar(x.count,pageMax)}</td></tr>`,'No page views yet.');
    $('#analytics-events-body').innerHTML=rows(events,x=>`<tr><td>${esc(String(x.event_name||'').replace(/_/g,' '))}</td><td>${number(x.count)}</td><td>${bar(x.count,eventMax)}</td></tr>`,'No feature events yet.');
    $('#analytics-entities-body').innerHTML=rows(entities,x=>`<tr><td>${esc(x.entity_type||'—')}</td><td>${esc(x.entity_key||'—')}</td><td>${number(x.count)}</td></tr>`,'No league or engine activity yet.');
    $('#analytics-device-body').innerHTML=rows(devices,x=>`<tr><td>${esc(x.device_class||'unknown')}</td><td>${number(x.sessions)}</td><td>${pct(x.share_pct)}</td></tr>`,'No device data yet.');
  }
  function renderVitals(){
    const v=report&&report.vitals||{};
    metric('#analytics-lcp',v.lcp_p75?ms(v.lcp_p75):'—',v.lcp_rating||'No samples');
    metric('#analytics-inp',v.inp_p75?ms(v.inp_p75):'—',v.inp_rating||'No samples');
    metric('#analytics-cls',v.cls_p75!=null?String(Math.round(Number(v.cls_p75)*1000)/1000):'—',v.cls_rating||'No samples');
    metric('#analytics-fcp',v.fcp_p75?ms(v.fcp_p75):'—',v.fcp_rating||'No samples');
  }
  function renderFunnel(){
    const f=report&&report.funnel||{};
    const steps=[['Board views',f.board_views],['Match opens',f.match_opens],['Records added',f.records_added],['Shares completed',f.shares_completed],['Community posts',f.community_posts]];
    const max=Math.max(1,...steps.map(x=>Number(x[1]||0)));
    const root=$('#analytics-funnel');if(root)root.innerHTML=steps.map(([label,value])=>`<div class="analytics-funnel-step"><div><strong>${esc(label)}</strong><span>${number(value)}</span></div>${bar(value,max)}</div>`).join('');
  }
  function render(){
    const r=report||{};
    metric('#analytics-sessions',number(r.sessions),'anonymous sessions');
    metric('#analytics-pageviews',number(r.page_views),'page views');
    metric('#analytics-actions',number(r.interactions),'feature actions');
    metric('#analytics-engagement',pct(r.engagement_rate),'engaged sessions');
    metric('#analytics-errors',number(r.client_errors),'client errors');
    metric('#analytics-push-optins',number(r.push_enabled),'push enable events');
    const range=$('#analytics-range-label');if(range)range.textContent=`Last ${days} days`;
    renderTrend();renderTables();renderVitals();renderFunnel();
    setState(`Updated ${new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date())}`,'good');
  }
  async function load(){
    if(loading)return;setBusy(true);setState('Loading product intelligence…');
    try{report=await rpc('p2u_admin_analytics_overview',{p_days:days});render()}catch(error){setState(error.message||'Could not load analytics.','bad')}finally{setBusy(false)}
  }
  function csvCell(value){const s=String(value==null?'':value);return`"${s.replace(/"/g,'""')}"`}
  function exportCsv(){
    if(!report)return;
    const lines=[['section','name','value']];
    for(const [name,value] of Object.entries({sessions:report.sessions,page_views:report.page_views,interactions:report.interactions,engagement_rate:report.engagement_rate,client_errors:report.client_errors,push_enabled:report.push_enabled}))lines.push(['overview',name,value]);
    for(const row of report.top_pages||[])lines.push(['top_page',row.page_path,row.count]);
    for(const row of report.top_events||[])lines.push(['top_event',row.event_name,row.count]);
    for(const row of report.top_entities||[])lines.push([row.entity_type,row.entity_key,row.count]);
    for(const row of report.daily||[])lines.push(['daily_page_views',row.day,row.page_views]);
    const blob=new Blob([lines.map(row=>row.map(csvCell).join(',')).join('\n')],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`predict2u-product-intelligence-${days}d-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);
  }
  async function purge(){
    const cutoff=new Date();cutoff.setMonth(cutoff.getMonth()-13);
    if(!confirm('Delete anonymous analytics events older than 13 months? This cannot be undone.'))return;
    setBusy(true);setState('Applying retention policy…');
    try{const result=await rpc('p2u_admin_analytics_purge',{p_before:cutoff.toISOString()});setState(`Deleted ${number(result&&result.deleted)} old events.`,'good');await load()}catch(error){setState(error.message||'Retention cleanup failed.','bad')}finally{setBusy(false)}
  }
  function bind(){
    document.addEventListener('click',event=>{
      const range=event.target.closest('[data-analytics-days]');if(range){days=Number(range.dataset.analyticsDays)||30;$$('[data-analytics-days]').forEach(x=>x.classList.toggle('active',x===range));load();return}
      if(event.target.closest('#refresh-analytics')){load();return}
      if(event.target.closest('#export-analytics')){exportCsv();return}
      if(event.target.closest('#purge-analytics')){purge();return}
      const tab=event.target.closest('[data-admin-tab="analytics"]');if(tab)setTimeout(load,50);
    });
  }
  function init(){
    if(!document.querySelector('[data-admin-panel="analytics"]'))return;
    bind();
    window.addEventListener('p2u:backend-admin-ready',()=>{if((location.hash||'').includes('analytics'))load()},{once:true});
    if(document.documentElement.dataset.p2uBackendAdminReady==='true'&&(location.hash||'').includes('analytics'))load();
    document.documentElement.dataset.p2uProductAnalyticsReady='true';
    window.dispatchEvent(new CustomEvent('p2u:product-analytics-ready',{detail:{version:VERSION}}));
  }
  window.P2UProductAnalytics={version:VERSION,load,getReport:()=>report,setDays:value=>{days=Math.max(1,Math.min(365,Number(value)||30));return load()},isReady:()=>document.documentElement.dataset.p2uProductAnalyticsReady==='true'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
