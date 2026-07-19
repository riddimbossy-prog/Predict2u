/* Predict2U v264 — branded in-app launch splash. Native OS splash remains icon/theme controlled. */
(function(){
  'use strict';
  const KEY='p2u-launch-v264';
  const home=/\/(?:index\.html)?$/.test(location.pathname)||location.pathname.endsWith('/');
  let seen=false;try{seen=sessionStorage.getItem(KEY)==='shown';}catch(_){}
  if(!home||seen){document.documentElement.dataset.p2uLaunching='false';return;}
  document.documentElement.dataset.p2uLaunching='true';
  function finish(node){
    if(!node)return;
    node.classList.add('is-leaving');
    setTimeout(()=>{node.remove();document.documentElement.dataset.p2uLaunching='false';try{sessionStorage.setItem(KEY,'shown');}catch(_){}window.dispatchEvent(new CustomEvent('p2u:launch-complete'));},260);
  }
  function mount(){
    const node=document.createElement('div');node.className='p2u-launch-splash';node.setAttribute('role','status');node.setAttribute('aria-label','Predict2U is opening');
    node.innerHTML='<div class="p2u-launch-shade"></div><div class="p2u-launch-content"><img src="icon-512.png" alt=""><strong>Predict<span>2U</span><small>.com</small></strong><p>Know the game. <b>Predict better.</b></p><i aria-hidden="true"></i></div>';
    document.body.appendChild(node);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(()=>finish(node),reduced?350:1250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
