/* Predict2U v291 — Stats2Pitch ad template */
(function(){
  'use strict';
  const KEY='p2u-s2p-ad-v291';
  const DEST='https://stats2pitch.com/daily-bankers.html';
  const FEED='https://olfoahrqvwrpfesfgjqk.supabase.co/functions/v1/stats2pitch-bankers';
  const FEED_KEY='sb_publishable_xle6S4IZ_djboDdfGfG4Rg_HXPYENZY';
  if(/stats2pitch\.com/i.test(location.hostname))return;
  if(sessionStorage.getItem(KEY)==='seen')return;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[c]));
  const fmt=v=>{const n=Number(v);return Number.isFinite(n)?n.toFixed(2):'—';};
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Accra',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function addDays(stamp,n){const d=new Date(stamp+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
  const fallback={home:'Whitecaps FC 2',away:'Sporting Kansas City II',pick:'Over 2.5',odds:1.33};

  function pickHtml(p){
    const match=((p.home||'')+' vs '+(p.away||'')).trim();
    return `<div class="p2u-s2p-ad-match">
      <span class="p2u-s2p-ad-ball" aria-hidden="true"></span>
      <strong>${esc(match)}</strong>
    </div>
    <div class="p2u-s2p-ad-split">
      <div><small>Pick</small><b>${esc(p.pick||'Open board')}</b></div>
      <div><small>Odds</small><em>${p.odds?fmt(p.odds):'FREE'}</em></div>
    </div>`;
  }

  function shards(card){
    const r=card.getBoundingClientRect();
    const cols=5, rows=4;
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const s=document.createElement('div');
        s.className='p2u-s2p-shard';
        const w=r.width/cols, h=r.height/rows;
        Object.assign(s.style,{
          width:w+'px',height:h+'px',left:(r.left+x*w)+'px',top:(r.top+y*h)+'px',
          background:y<2?'#102418':'#070b10',
          outline:'1px solid rgba(212,175,55,.22)'
        });
        const dx=(x-2)*190+(Math.random()*150-75);
        const dy=(y-1.2)*240-80-Math.random()*260;
        const rot=(Math.random()*980-490);
        document.body.appendChild(s);
        s.animate([
          {transform:'translate(0,0) rotate(0) scale(1)',opacity:1,filter:'brightness(1.8)'},
          {transform:`translate(${dx}px,${dy}px) rotate(${rot}deg) scale(${.12+Math.random()*.28})`,opacity:0,filter:'brightness(.5)'}
        ],{duration:680+Math.random()*260,easing:'cubic-bezier(.12,.82,.2,1)',fill:'forwards'});
        setTimeout(()=>s.remove(),1000);
      }
    }
    for(let i=0;i<22;i++){
      const p=document.createElement('div');
      p.className='p2u-s2p-shard';
      const size=6+Math.random()*12;
      Object.assign(p.style,{
        width:size+'px',height:size+'px',borderRadius:'50%',
        left:(r.left+r.width/2)+'px',top:(r.top+r.height/2)+'px',
        background:i%2?'#d4af37':'#22c55e',boxShadow:'0 0 14px currentColor'
      });
      const ang=Math.random()*Math.PI*2, dist=160+Math.random()*280;
      document.body.appendChild(p);
      p.animate([
        {transform:'translate(-50%,-50%) scale(1)',opacity:1},
        {transform:`translate(calc(-50% + ${Math.cos(ang)*dist}px), calc(-50% + ${Math.sin(ang)*dist}px)) scale(0)`,opacity:0}
      ],{duration:560+Math.random()*280,easing:'cubic-bezier(.12,.8,.2,1)',fill:'forwards'});
      setTimeout(()=>p.remove(),900);
    }
  }

  function mount(pick){
    if(document.querySelector('.p2u-s2p-ad-backdrop'))return;
    const wrap=document.createElement('div');
    wrap.className='p2u-s2p-ad-backdrop is-on';
    wrap.innerHTML=`<span class="p2u-s2p-ad-shock"></span>
      <article class="p2u-s2p-ad-card" role="dialog" aria-modal="true" aria-label="Stats2Pitch free picks">
        <button type="button" class="p2u-s2p-ad-close" aria-label="Close">×</button>
        <div class="p2u-s2p-ad-mark" aria-hidden="true">
          <svg viewBox="0 0 64 48" fill="none" stroke="#fff" stroke-width="2.2">
            <rect x="8" y="6" width="48" height="36"/>
            <line x1="32" y1="6" x2="32" y2="42"/>
            <rect x="8" y="16" width="8" height="16"/>
            <rect x="48" y="16" width="8" height="16"/>
            <circle cx="32" cy="24" r="8"/>
          </svg>
          <b>2</b>
        </div>
        <h2>stats2pitch</h2>
        <p class="p2u-s2p-ad-free">Free Picks</p>
        <p class="p2u-s2p-ad-check"><i></i> Check stats2pitch.com</p>
        <p class="p2u-s2p-ad-copy">Free bankers. <em>Same board.</em> No signup.</p>
        <div class="p2u-s2p-ad-panel">${pickHtml(pick)}</div>
        <a class="p2u-s2p-ad-cta" href="${DEST}">See free bankers</a>
        <button type="button" class="p2u-s2p-ad-open" data-s2p-go="1">Open board</button>
        <span class="p2u-s2p-ad-age">18+</span>
      </article>`;
    document.body.appendChild(wrap);
    document.body.classList.add('p2u-s2p-ad-lock');

    const card=wrap.querySelector('.p2u-s2p-ad-card');
    const go=()=>{
      if(card.classList.contains('is-blow'))return;
      sessionStorage.setItem(KEY,'seen');
      wrap.classList.add('is-blow');
      shards(card);
      card.classList.add('is-blow');
      wrap.classList.add('is-out');
      setTimeout(()=>{location.href=DEST;},760);
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

  function fill(pick){
    const box=document.querySelector('.p2u-s2p-ad-panel');
    if(box)box.innerHTML=pickHtml(pick);
  }

  async function loadPick(){
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
          const p=pack[0];
          return {home:p.home,away:p.away,pick:p.displaySelection||p.pick||p.selection,odds:p.odds};
        }
      }
    }catch{}
    clearTimeout(timer);
    return fallback;
  }

  function boot(){
    mount(fallback);
    loadPick().then(pick=>{if(pick)fill(pick);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
