/* Predict2U v289 — Stats2Pitch open-site promo */
(function(){
  'use strict';
  const KEY='p2u-s2p-ad-v289';
  const DEST='https://stats2pitch.com/daily-bankers.html';
  const FEED='https://olfoahrqvwrpfesfgjqk.supabase.co/functions/v1/stats2pitch-bankers';
  const FEED_KEY='sb_publishable_xle6S4IZ_djboDdfGfG4Rg_HXPYENZY';
  if(/stats2pitch\.com/i.test(location.hostname))return;
  if(sessionStorage.getItem(KEY)==='seen')return;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[c]));
  const fmt=v=>{const n=Number(v);return Number.isFinite(n)?n.toFixed(2):'—';};
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Accra',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function addDays(stamp,n){const d=new Date(stamp+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
  const fallback=[
    {home:'Free bankers',away:'live board',pick:'Open the daily board',odds:null},
    {home:'No signup',away:'no paywall',pick:'Same SportyBet prices',odds:null}
  ];

  function rowHtml(picks){
    return picks.map(p=>`<div class="p2u-s2p-ad-row"><div><small>${esc(p.home)} vs ${esc(p.away)}</small><strong>${esc(p.pick)}</strong></div><em>${p.odds?fmt(p.odds):'FREE'}</em></div>`).join('');
  }

  function mount(picks){
    if(document.querySelector('.p2u-s2p-ad-backdrop'))return;
    const wrap=document.createElement('div');
    wrap.className='p2u-s2p-ad-backdrop is-on';
    wrap.innerHTML=`<article class="p2u-s2p-ad-card" role="dialog" aria-modal="true" aria-label="Stats2Pitch free picks">
      <button type="button" class="p2u-s2p-ad-close" aria-label="Close">×</button>
      <div class="p2u-s2p-ad-hero"><b>stats2pitch</b><span>Free Picks</span></div>
      <p class="p2u-s2p-ad-copy">Check Stats2Pitch.com for free bankers. Same board. No signup.</p>
      <div class="p2u-s2p-ad-rows">${rowHtml(picks)}</div>
      <a class="p2u-s2p-ad-cta" href="${DEST}">See free bankers</a>
      <div class="p2u-s2p-ad-foot"><span>18+</span><button type="button" data-s2p-go="1">Open board</button></div>
    </article>`;
    document.body.appendChild(wrap);
    document.body.classList.add('p2u-s2p-ad-lock');

    const card=wrap.querySelector('.p2u-s2p-ad-card');
    const go=()=>{
      if(card.classList.contains('is-blow'))return;
      sessionStorage.setItem(KEY,'seen');
      card.classList.add('is-blow');
      wrap.classList.add('is-out');
      setTimeout(()=>{location.href=DEST;},480);
    };
    const hide=()=>{
      sessionStorage.setItem(KEY,'seen');
      wrap.classList.add('is-out');
      document.body.classList.remove('p2u-s2p-ad-lock');
      setTimeout(()=>wrap.remove(),280);
    };
    wrap.querySelector('.p2u-s2p-ad-close').addEventListener('click',e=>{e.stopPropagation();hide();});
    wrap.addEventListener('click',e=>{if(e.target===wrap)hide();});
    card.addEventListener('click',e=>{
      if(e.target.closest('.p2u-s2p-ad-close'))return;
      e.preventDefault();
      go();
    });
  }

  function fill(picks){
    const box=document.querySelector('.p2u-s2p-ad-rows');
    if(box)box.innerHTML=rowHtml(picks);
  }

  async function loadPicks(){
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),1800);
    try{
      const dates=[today(),addDays(today(),1)];
      for(const date of dates){
        const res=await fetch(FEED+'?date='+encodeURIComponent(date),{headers:{apikey:FEED_KEY,Authorization:'Bearer '+FEED_KEY},cache:'no-store',signal:ctrl.signal});
        const body=await res.json().catch(()=>null);
        const pack=[...(body&&body.safestBankers||[]),...(body&&body.valueBankers||[])].filter(p=>p&&p.home&&p.away);
        if(pack.length){
          clearTimeout(timer);
          return pack.slice(0,2).map(p=>({home:p.home,away:p.away,pick:p.displaySelection||p.pick||p.selection,odds:p.odds}));
        }
      }
    }catch{}
    clearTimeout(timer);
    return fallback;
  }

  function boot(){
    mount(fallback);
    loadPicks().then(picks=>{if(picks&&picks!==fallback)fill(picks);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
