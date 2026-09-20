/* Predict2U v292 — client cache refresh after SMT match-data reasoning. */
(function(){
  'use strict';
  const KEY='p2u_cache_refresh_v292';
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
    window.dispatchEvent(new CustomEvent('p2u:cache-refreshed',{detail:{version:'v292'}}));
    try{
      const url=new URL(location.href);
      if(url.searchParams.get('refresh')!=='v292'){
        url.searchParams.set('refresh','v292');
        location.replace(url.href);
      }
    }catch(_){location.reload();}
  };
  clear();
})();
