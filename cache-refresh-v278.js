/* Predict2U v286 — client cache refresh for SportyBet odds overlay. */
(function(){
  'use strict';
  const KEY='p2u_cache_refresh_v286';
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
    window.dispatchEvent(new CustomEvent('p2u:cache-refreshed',{detail:{version:'v286'}}));
    try{
      const url=new URL(location.href);
      if(url.searchParams.get('refresh')!=='v286'){
        url.searchParams.set('refresh','v286');
        location.replace(url.href);
      }
    }catch(_){location.reload();}
  };
  clear();
})();
