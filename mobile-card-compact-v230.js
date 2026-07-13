
(function(){
  'use strict';
  const host=document.getElementById('cards');
  if(!host)return;
  const chevron='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  function prepare(card){
    if(!card||card.nodeType!==1||!card.classList.contains('p2u-standard-card')||card.querySelector('.p2u-mobile-card-toggle'))return;
    const prediction=card.querySelector('.p2u-prediction-panel');
    if(!prediction)return;
    const button=document.createElement('button');
    button.type='button';
    button.className='p2u-mobile-card-toggle';
    button.setAttribute('aria-expanded','false');
    button.innerHTML='<span>Details & actions</span>'+chevron;
    prediction.insertAdjacentElement('afterend',button);
    button.addEventListener('click',()=>{
      const expanded=card.classList.toggle('is-mobile-expanded');
      button.setAttribute('aria-expanded',String(expanded));
      button.querySelector('span').textContent=expanded?'Hide details':'Details & actions';
      if(!expanded){
        const details=card.querySelector('.details.open');
        const nativeButton=card.querySelector('[data-det]');
        if(details){details.classList.remove('open');details.innerHTML='';}
        if(nativeButton){nativeButton.setAttribute('aria-expanded','false');nativeButton.innerHTML='<i class="fa-solid fa-list-ul"></i><span>Details</span>';}
      }
    });
  }
  function scan(){Array.from(host.children).forEach(prepare)}
  scan();
  new MutationObserver(scan).observe(host,{childList:true});
})();
