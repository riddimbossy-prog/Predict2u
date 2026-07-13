/* Predict2U v223 — mobile navigation with full-page access */
(function(){
  "use strict";
  const VERSION="v223";
  const icons={overview:"<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M12 4v3M20 12h-3M12 20v-3M4 12h3\"/><path d=\"m12 12 4-4\"/></svg>",board:"<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"17\" rx=\"3\"/><path d=\"M8 2v4M16 2v4M3 9h18\"/><path d=\"M8 13h3M13 13h3M8 17h3\"/></svg>",full:"<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"2\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"2\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"2\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"2\"/></svg>",proof:"<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z\"/><path d=\"m8.5 12 2.2 2.2 4.8-5\"/></svg>",more:"<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 7h16M4 12h16M4 17h16\"/></svg>"};
  const items=[
    {id:"overview",label:"Overview",href:"index.html"},
    {id:"board",label:"Board",href:"board.html"},
    {id:"full",label:"Full Board",href:"engines.html"},
    {id:"proof",label:"Proof",href:"proof.html"},
    {id:"more",label:"More",href:"#"}
  ];
  function page(){const p=(location.pathname.split('/').pop()||'index.html').toLowerCase();if(p==='index.html'||p==='')return'overview';if(p==='board.html')return'board';if(p==='engines.html')return'full';if(p==='proof.html')return'proof';return'more'}
  function mount(){document.querySelectorAll('.community-mobile-nav').forEach(el=>el.remove());let nav=document.querySelector('.p2u-mobile-app-nav');if(nav)nav.remove();const active=page();nav=document.createElement('nav');nav.className='p2u-mobile-app-nav';nav.setAttribute('aria-label','Primary mobile navigation');nav.dataset.version=VERSION;nav.innerHTML='<div class="p2u-mobile-app-nav__inner">'+items.map(item=>`<a href="${item.href}" class="${item.id===active?'is-active':''}"${item.id===active?' aria-current="page"':''} data-p2u-mobile-nav="${item.id}">${icons[item.id]}<span>${item.label}</span></a>`).join('')+'</div>';document.body.appendChild(nav);nav.querySelector('[data-p2u-mobile-nav="more"]').addEventListener('click',e=>{e.preventDefault();window.dispatchEvent(new CustomEvent('p2u:open-pages-menu'))});document.documentElement.dataset.p2uMobileNavReady='true';window.dispatchEvent(new CustomEvent('p2u:mobile-nav-ready',{detail:{version:VERSION,active}}))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();