/* Predict2U v271 — minimal public learning status for Auto Picks Gatekeeper v2. */
(function(){
  'use strict';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  let publicState=null;
  function statusLabel(state){return state==='stable'?'Stable':state==='active'?'Active':'Monitoring';}
  function render(){
    const root=$('team-auto-learning');if(!root)return;
    const s=publicState||{modelVersion:'Auto Profile v2.0',status:'monitoring',settled:0,recent:[]};
    root.innerHTML=`<div><span>LEARNING SUPERVISOR</span><b>${esc(statusLabel(s.status))}</b></div><p>${esc(s.modelVersion||'Auto Profile v2.0')} · ${Number(s.settled||0)} settled selections</p><small>Settled results are reviewed privately. Public cards show only model status and verified outcomes.</small>`;
    const recent=$('team-auto-learning-recent');if(recent)recent.innerHTML='';
  }
  async function load(){
    try{const r=await fetch(`auto-picks-learning-public-v271.json?v=${Date.now()}`,{cache:'no-store'});if(r.ok)publicState=await r.json();}catch(_){/* quiet fallback */}
    render();window.dispatchEvent(new CustomEvent('p2u:auto-learning-loaded',{detail:publicState}));
  }
  function decorate(){
    document.querySelectorAll('.p2u-auto-learning-pill').forEach(el=>{const state=el.dataset.learningState||'monitor';el.textContent=state==='watch'?'Model watch':state==='boost'?'Model confirmed':state==='stable'?'Model stable':'Learning tracked';});
  }
  window.P2UAutoLearningV271={decorate,load,get state(){return publicState;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
