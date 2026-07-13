(function(){
  'use strict';
  if(document.querySelector('.p2u-v227-nav-wrap')) return;

  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const active=page===''?'index.html':page;
  const svg=(name)=>{
    const icons={
      overview:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/></svg>',
      board:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16M8 13h3M13 13h3M8 17h3"/></svg>',
      full:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M15 9v11"/></svg>',
      engines:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>',
      proof:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.7 8.2 7 10 4.3-1.8 7-5.4 7-10V6z"/><path d="m9 12 2 2 4-5"/></svg>',
      scores:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16"/><path d="m7 15 4-4 3 2 5-6"/></svg>',
      dna:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3c0 5 8 5 8 10s-8 5-8 8M16 3c0 5-8 5-8 10s8 5 8 8M9 7h6M9 17h6"/></svg>',
      community:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1"/></svg>',
      news:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
      more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>',
      account:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
      trust:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
      legal:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>'
    };
    return icons[name]||icons.more;
  };

  const links=[
    {href:'board.html',label:"Today's Board",icon:'board'},
    {href:'engines.html',label:'Full Board',icon:'full'},
    {href:'board.html#engines',label:'Engines',icon:'engines',match:'engines-section'},
    {href:'proof.html',label:'Proof',icon:'proof'},
    {href:'scorecards.html',label:'Scorecards',icon:'scores'},
    {href:'league-dna.html',label:'League DNA',icon:'dna'},
    {href:'community.html',label:'Community',icon:'community'},
    {href:'news.html',label:'News',icon:'news'}
  ];
  const isActive=(item)=>{
    if(item.match==='engines-section') return active==='board.html' && location.hash==='#engines';
    return active===item.href;
  };

  const nav=document.createElement('nav');
  nav.className='p2u-v227-nav-wrap';
  nav.setAttribute('aria-label','Primary navigation');
  nav.innerHTML=`
    <div class="p2u-v227-shell">
      <a class="p2u-v227-brand" href="board.html" aria-label="Predict2U home">
        <img src="predict2u-logo.png" alt="Predict2U"/>
      </a>
      <div class="p2u-v227-rail" role="navigation">
        ${links.map(item=>`<a href="${item.href}" class="p2u-v227-link${isActive(item)?' is-active':''}"${isActive(item)?' aria-current="page"':''}>${svg(item.icon)}<span>${item.label}</span></a>`).join('')}
      </div>
      <div class="p2u-v227-side">
        <div class="p2u-v227-live"><span class="p2u-v227-live-dot"></span><strong>LIVE</strong><span id="live-stamp">· --:--</span></div>
        <a id="user-chip" class="p2u-v227-user" href="account.html" aria-label="Account and cloud sync">
          <span class="p2u-v227-user-copy"><strong id="user-name">Sign in</strong><small id="user-sub">Cloud sync</small></span>
          <span id="user-av" class="p2u-v227-avatar">${svg('account')}</span>
        </a>
      </div>
    </div>`;
  document.body.prepend(nav);

  const dock=document.createElement('nav');
  dock.className='p2u-v227-dock';
  dock.setAttribute('aria-label','Mobile navigation');
  const dockItems=[links[0],links[1],links[3],links[4]];
  dock.innerHTML=dockItems.map(item=>`<a href="${item.href}" class="${isActive(item)?'is-active':''}">${svg(item.icon)}<span>${item.label.replace("Today's ",'')}</span></a>`).join('')+
    `<button type="button" class="p2u-v227-more-btn" aria-expanded="false" aria-controls="p2u-v227-more">${svg('more')}<span>More</span></button>`;
  document.body.appendChild(dock);

  const extra=[
    ...links,
    {href:'account.html',label:'Account',icon:'account'},
    {href:'trust.html',label:'Trust Center',icon:'trust'},
    {href:'responsible-gambling.html',label:'Responsible Use',icon:'trust'},
    {href:'terms.html',label:'Terms',icon:'legal'},
    {href:'privacy.html',label:'Privacy',icon:'proof'},
    {href:'disclaimer.html',label:'Disclaimer',icon:'legal'}
  ];
  const overlay=document.createElement('div');
  overlay.className='p2u-v227-more-backdrop';
  overlay.id='p2u-v227-more';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`<section class="p2u-v227-more-panel" role="dialog" aria-modal="true" aria-labelledby="p2u-v227-more-title">
    <div class="p2u-v227-more-head"><div><strong id="p2u-v227-more-title">Explore Predict2U</strong><small>All pages remain easy to reach.</small></div><button type="button" class="p2u-v227-more-close" aria-label="Close menu">×</button></div>
    <div class="p2u-v227-more-grid">${extra.map(item=>`<a href="${item.href}" class="${isActive(item)?'is-active':''}">${svg(item.icon)}<span>${item.label}</span></a>`).join('')}</div>
  </section>`;
  document.body.appendChild(overlay);

  const moreBtn=dock.querySelector('.p2u-v227-more-btn');
  const close=()=>{overlay.classList.remove('is-open');overlay.setAttribute('aria-hidden','true');moreBtn.setAttribute('aria-expanded','false');document.body.classList.remove('p2u-v227-menu-open');};
  const open=()=>{overlay.classList.add('is-open');overlay.setAttribute('aria-hidden','false');moreBtn.setAttribute('aria-expanded','true');document.body.classList.add('p2u-v227-menu-open');overlay.querySelector('.p2u-v227-more-close').focus();};
  moreBtn.addEventListener('click',()=>overlay.classList.contains('is-open')?close():open());
  overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('.p2u-v227-more-close'))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});

  document.body.classList.add('p2u-v227-ready','p2u-phase2-ready','p2u-v227-page-'+active.replace('.html','').replace(/[^a-z0-9-]/g,''));
  document.documentElement.classList.add('p2u-v227-html');

  const tick=()=>{const el=document.getElementById('live-stamp');if(el)el.textContent='· '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});};
  tick();setInterval(tick,60000);

  requestAnimationFrame(()=>{
    const rail=nav.querySelector('.p2u-v227-rail');
    const current=rail.querySelector('.is-active');
    if(current){rail.scrollLeft=Math.max(0,current.offsetLeft-(rail.clientWidth-current.offsetWidth)/2);}
  });
})();
