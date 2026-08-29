/* Predict2U v281 — clean prediction cards with one explanation path. */
(function(){
  'use strict';
  const VERSION='v281';
  const CARD_SELECTOR='[data-p2u-home][data-p2u-away],.engine-pick-card,.p2u-market-card.is-edge,.p2u-auto-pick-card,.p2u-pick';
  let timer=null,observer=null;

  const txt=node=>String(node&&node.textContent||'').trim();

  function setWhyLabel(button){
    if(!button)return;
    const open=button.getAttribute('aria-expanded')==='true';
    if(button.matches('.btn-det')){
      const span=button.querySelector('span');
      if(span)span.textContent=open?'Hide why':'Why this pick';
      else button.textContent=open?'Hide why':'Why this pick';
      button.title='See how Predict2U arrived at this tip';
      return;
    }
    if(button.matches('.btn-info')){
      button.classList.add('p2u-clean-why-inline');
      button.innerHTML=`<span>${open?'Hide why':'Why this pick'}</span>`;
      button.title='See how Predict2U arrived at this tip';
    }
  }

  function cleanExistingControls(card){
    card.querySelectorAll('[data-det]').forEach(setWhyLabel);
    card.querySelectorAll('[data-fullboard-toggle]').forEach(button=>{
      const span=button.querySelector('span');
      if(span)span.textContent=button.getAttribute('aria-expanded')==='true'?'Less':'More';
      button.setAttribute('aria-label','Show more match actions');
    });
    card.querySelectorAll('[data-auto-open]').forEach(button=>{
      button.textContent='Why this pick';
      button.title='Open the full Predict2U analysis';
    });
  }

  function addToggle(card,kind){
    if(card.querySelector('[data-p2u-clean-why]'))return;
    const button=document.createElement('button');
    button.type='button';button.className='p2u-clean-why';button.dataset.p2uCleanWhy=kind;
    button.setAttribute('aria-expanded','false');button.textContent='Why this pick';
    button.addEventListener('click',()=>{
      const open=card.classList.toggle('p2u-explain-open');
      button.setAttribute('aria-expanded',open?'true':'false');
      button.textContent=open?'Hide why':'Why this pick';
    });
    const actions=card.querySelector('.engine-card-foot,.p2u-market-actions');
    if(actions)actions.parentNode.insertBefore(button,actions);else card.appendChild(button);
  }

  function compactCautions(card){
    const box=card.querySelector('[data-p2u-context-flags]');
    if(!box||box.dataset.p2uCleanReady==='1')return;
    box.dataset.p2uCleanReady='1';
    const head=box.querySelector('.p2u-context-flags-head'),list=box.querySelector('.p2u-context-flags-list');
    if(!head||!list)return;
    const count=list.querySelectorAll('.p2u-context-flag-item').length;
    const strong=head.querySelector('strong');if(strong)strong.textContent=`${count} caution${count===1?'':'s'}`;
    head.setAttribute('role','button');head.tabIndex=0;head.setAttribute('aria-expanded','false');
    const toggle=()=>{const open=box.classList.toggle('is-open');head.setAttribute('aria-expanded',open?'true':'false');};
    head.addEventListener('click',toggle);head.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
  }

  function cleanEngineCard(card){
    card.querySelectorAll('.engine-badge').forEach(badge=>{
      if(/books|odds loaded|ht\/ft/i.test(txt(badge)))badge.classList.add('p2u-clean-secondary-badge');
    });
    if(card.querySelector('.engine-reasons'))addToggle(card,'engine');
  }

  function cleanMarketCard(card){
    if(card.querySelector('.p2u-market-metrics,.p2u-market-reasons'))addToggle(card,'market');
  }

  function cleanCard(card){
    if(!card||!card.querySelector)return;
    card.dataset.p2uCleanV281='1';
    cleanExistingControls(card);
    if(card.matches('.engine-pick-card'))cleanEngineCard(card);
    if(card.matches('.p2u-market-card.is-edge'))cleanMarketCard(card);
    compactCautions(card);
  }

  function scan(root=document){
    document.documentElement.classList.add('p2u-clean-v281');
    document.documentElement.classList.remove('p2u-hide-why');
    const cards=[];
    if(root&&root.matches&&root.matches(CARD_SELECTOR))cards.push(root);
    if(root&&root.querySelectorAll)cards.push(...root.querySelectorAll(CARD_SELECTOR));
    [...new Set(cards)].forEach(cleanCard);
    document.querySelectorAll('[data-p2u-context-flags]').forEach(box=>{const card=box.closest(CARD_SELECTOR);if(card)compactCautions(card);});
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(()=>scan(document),40);}
  function start(){scan(document);if(observer)return;observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});}
  window.P2UTipExplanationCleanV281={version:VERSION,scan};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
