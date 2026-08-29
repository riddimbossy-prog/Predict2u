/* Predict2U v281 — hide public tip-method copy */
(function(){
  'use strict';
  const VERSION='v281';
  const CARD_SELECTOR='[data-p2u-home][data-p2u-away],.engine-pick-card,.p2u-market-card.is-edge,.p2u-auto-pick-card,.p2u-pick';
  let timer=null,observer=null;
  function strip(root){
    document.documentElement.classList.add('p2u-clean-v281','p2u-hide-why');
    const scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll('.btn-det,.btn-info,[data-det],[data-auto-open],[data-p2u-clean-why],.p2u-clean-why,.engine-reasons,.p2u-market-reasons,.p2u-market-metrics').forEach(n=>n.remove());
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>strip(document),40);}
  function start(){strip(document);if(observer)return;observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});}
  window.P2UTipExplanationCleanV281={version:VERSION,scan:strip};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
