
(function(){
  'use strict';
  const hosts=[document.getElementById('matches-grid'),document.getElementById('top-bankers-grid')].filter(Boolean);
  if(!hosts.length)return;
  const chevron='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  function closeNative(card){
    const details=card.querySelector('.details.open');
    const nativeButton=card.querySelector('[data-det]');
    if(details){details.classList.remove('open');details.innerHTML='';}
    if(nativeButton)nativeButton.setAttribute('aria-expanded','false');
  }
  hosts.forEach(host=>{
    host.addEventListener('click',event=>{
      const toggle=event.target.closest('[data-fullboard-toggle]');
      if(!toggle)return;
      const card=toggle.closest('.p2u-fullboard-card');
      if(!card)return;
      const expanded=card.classList.toggle('is-mobile-expanded');
      toggle.setAttribute('aria-expanded',String(expanded));
      const label=toggle.querySelector('span');
      if(label)label.textContent=expanded?'Hide details':'Details & actions';
      if(!expanded)closeNative(card);
    });
  });
})();
