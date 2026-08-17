/* Predict2U v278 — one-time client cache refresh for Team/Market Intelligence rollout. */
(function(){
  'use strict';
  const KEY='p2u_cache_refresh_v278';
  try{if(localStorage.getItem(KEY)==='done')return;}catch(_){ }
  const mark=()=>{try{localStorage.setItem(KEY,'done');}catch(_){ }};
  const clear=async()=>{
    try{
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>String(k).startsWith('predict2u-')).map(k=>caches.delete(k)));
      }
    }catch(_){ }
    try{
      if('serviceWorker' in navigator){
        const reg=await navigator.serviceWorker.getRegistration();
        if(reg)await reg.update().catch(()=>{});
      }
    }catch(_){ }
    mark();
    window.dispatchEvent(new CustomEvent('p2u:cache-refreshed',{detail:{version:'v278'}}));
  };
  clear();
})();
