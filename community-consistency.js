/* Predict2U v188 — Community consistency and progressive board reveal. */
(()=>{
  "use strict";
  const PAGE_SIZE=()=>matchMedia("(max-width:639px)").matches?12:20;
  let shown=PAGE_SIZE(),observer=null,queued=false;
  const $=s=>document.querySelector(s);
  function sectionClasses(){
    const map=[["#top-picks","community-section-featured"],["#popular","community-section-popular"],["#board","community-section-board"],["#users-board","community-section-ranking"],["#members","community-section-members"],["#feed","community-section-feed"],["#my-slips","community-section-slips"]];
    for(const [sel,cls] of map){const host=$(sel),card=host?.closest(".card");if(card)card.classList.add("p2u-community-section",cls)}
  }
  function controls(){
    const board=$("#board");if(!board)return null;let wrap=$("#p2u-community-board-controls");
    if(!wrap){wrap=document.createElement("div");wrap.id="p2u-community-board-controls";wrap.className="p2u-community-board-controls";wrap.innerHTML='<span id="p2u-community-board-progress"></span><button type="button" id="p2u-community-board-more" class="ghost">Show more</button>';board.insertAdjacentElement("afterend",wrap);$("#p2u-community-board-more")?.addEventListener("click",()=>{const items=[...board.querySelectorAll(":scope > .pick")];if(shown>=items.length)shown=PAGE_SIZE();else shown+=PAGE_SIZE();apply()})}
    return wrap;
  }
  function apply(){
    const board=$("#board");if(!board)return;const items=[...board.querySelectorAll(":scope > .pick")];const wrap=controls();
    items.forEach((el,i)=>{el.hidden=i>=shown;el.setAttribute("aria-hidden",i>=shown?"true":"false")});
    const progress=$("#p2u-community-board-progress"),btn=$("#p2u-community-board-more"),visible=Math.min(shown,items.length);
    if(progress)progress.textContent=items.length?`Showing ${visible} of ${items.length}`:"";
    if(btn){btn.hidden=items.length<=PAGE_SIZE();btn.textContent=shown>=items.length?"Show fewer":`Show ${Math.min(PAGE_SIZE(),items.length-visible)} more`}
    if(wrap)wrap.hidden=!items.length;document.documentElement.dataset.p2uCommunityConsistency="ready";window.dispatchEvent(new CustomEvent("p2u:community-consistency-ready",{detail:{items:items.length,visible}}));
  }
  function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;sectionClasses();apply()},40)}
  function start(){
    document.body.classList.add("p2u-community-consistent");sectionClasses();apply();const board=$("#board");if(board){observer=new MutationObserver(schedule);observer.observe(board,{childList:true})}
    for(const id of ["board-search","board-min"]){$("#"+id)?.addEventListener("input",()=>{shown=PAGE_SIZE();setTimeout(schedule,0)});$("#"+id)?.addEventListener("change",()=>{shown=PAGE_SIZE();setTimeout(schedule,0)})}
    window.addEventListener("resize",()=>{shown=Math.max(shown,PAGE_SIZE());schedule()},{passive:true});window.addEventListener("P2U_COMMUNITY_UPDATED",schedule);window.addEventListener("p2u:community-updated",schedule);
  }
  window.P2UCommunityConsistency={refresh:schedule,reset:()=>{shown=PAGE_SIZE();schedule()},showAll:()=>{shown=Number.MAX_SAFE_INTEGER;schedule()}};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
