/* Predict2U v283 — client cache refresh for Community nav + Why this pick restore. */
(function(){
  'use strict';
  const KEY='p2u_cache_refresh_v283';
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
    window.dispatchEvent(new CustomEvent('p2u:cache-refreshed',{detail:{version:'v283'}}));
    try{
      const url=new URL(location.href);
      if(url.searchParams.get('refresh')!=='v283'){
        url.searchParams.set('refresh','v283');
        location.replace(url.href);
      }
    }catch(_){location.reload();}
  };
  clear();
})();
