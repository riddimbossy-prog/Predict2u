/* Predict2U v264 — automatic first-open walkthrough and replay support. */
(function(){
  'use strict';
  const KEY='p2u-first-run-v264';
  const force=new URLSearchParams(location.search).get('tour')==='1';
  try{if(!force&&localStorage.getItem(KEY)==='seen')return;}catch(_){}
  function mount(){
    const overlay=document.createElement('div');overlay.className='p2u-tour';overlay.id='p2u-first-run-tour';
    overlay.innerHTML=`<section class="p2u-tour-card" role="dialog" aria-modal="true" aria-label="Predict2U walkthrough"><button class="p2u-tour-close" type="button" aria-label="Close walkthrough">×</button><div class="p2u-tour-visual"><img class="p2u-tour-mark" src="icon-512.png" alt="Predict2U P logo"></div><div class="p2u-tour-body"><article class="p2u-tour-step is-active" data-step="0"><span class="p2u-tour-kicker">WELCOME</span><h2>Know the game.<br><span style="color:#b7ef31">Predict better.</span></h2><p>Predict2U filters football fixtures through strict model families, then keeps the reasoning and results visible.</p></article><article class="p2u-tour-step" data-step="1"><span class="p2u-tour-kicker">HOW IT WORKS</span><h2>Four simple moves.</h2><div class="p2u-tour-list"><div><b>See today’s picks</b><span>Only qualified current fixtures appear.</span></div><div><b>Check Bankers</b><span>Stricter selections, never a guaranteed result.</span></div><div><b>Open an engine</b><span>Read the exact rules and reasons.</span></div><div><b>Build your slip</b><span>Add selections locally; sign in only to save or publish.</span></div></div></article><article class="p2u-tour-step" data-step="2"><span class="p2u-tour-kicker">YOU’RE READY</span><h2>Start with proof.</h2><p>Use Proof to review settled wins, losses and model behavior. When data is stale, publishing pauses automatically.</p><div class="p2u-tour-install"><img src="icon-192.png" alt=""><div><b>Bold P on your phone</b><small>Install the PWA to add the official Predict2U icon to your home screen.</small></div></div></article><div class="p2u-tour-actions"><div class="p2u-tour-dots"><i class="is-active"></i><i></i><i></i></div><div class="p2u-tour-buttons"><button class="p2u-tour-secondary" type="button" data-back hidden>Back</button><button class="p2u-tour-primary" type="button" data-next>Next</button></div></div></div></section>`;
    document.body.appendChild(overlay);
    const steps=[...overlay.querySelectorAll('[data-step]')],dots=[...overlay.querySelectorAll('.p2u-tour-dots i')];let index=0;
    const finish=()=>{try{localStorage.setItem(KEY,'seen');}catch(_){}overlay.remove();};
    const render=()=>{steps.forEach((s,i)=>s.classList.toggle('is-active',i===index));dots.forEach((d,i)=>d.classList.toggle('is-active',i===index));overlay.querySelector('[data-back]').hidden=index===0;overlay.querySelector('[data-next]').textContent=index===steps.length-1?'Start exploring':'Next';};
    overlay.querySelector('[data-next]').onclick=()=>{if(index===steps.length-1)finish();else{index++;render();}};
    overlay.querySelector('[data-back]').onclick=()=>{index=Math.max(0,index-1);render();};overlay.querySelector('.p2u-tour-close').onclick=finish;
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.contains(overlay))finish();},{once:true});
  }
  const begin=()=>{if(document.documentElement.dataset.p2uLaunching==='true')window.addEventListener('p2u:launch-complete',mount,{once:true});else mount();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
})();
