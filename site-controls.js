/* Predict2U v169 public operator controls.
   Applies only non-sensitive, committed configuration from admin-config.js. */
(function(){
  "use strict";
  const cfg=window.P2U_ADMIN_CONFIG||{};
  const board=cfg.board||{},announcement=cfg.announcement||{},community=cfg.community||{};
  const hidden=new Set((community.hiddenIds||[]).map(String));
  const verified=new Set((community.verifiedIds||[]).map(String));
  const dismissedKey=`p2u-announcement-dismissed-${cfg.version||"current"}`;

  function esc(value){return String(value==null?"":value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
  function announcementActive(){
    if(!announcement.enabled||!String(announcement.message||"").trim())return false;
    if(announcement.expiresAt){const t=Date.parse(announcement.expiresAt);if(Number.isFinite(t)&&Date.now()>t)return false;}
    try{if(localStorage.getItem(dismissedKey)==="1")return false;}catch(_){}
    return true;
  }
  function mountAnnouncement(){
    if(!announcementActive()||document.getElementById("p2u-operator-note"))return;
    const host=document.createElement("div");host.id="p2u-operator-note";host.className="p2u-operator-note";host.dataset.tone=["success","warning","info"].includes(announcement.tone)?announcement.tone:"info";
    const safeUrl=/^(?:https?:\/\/|[\w./-]+\.html(?:[#?].*)?|#)/i.test(String(announcement.linkUrl||""))?announcement.linkUrl:"";
    host.innerHTML=`<div class="p2u-operator-note-inner"><span class="p2u-operator-dot" aria-hidden="true"></span><span class="p2u-operator-note-message">${esc(announcement.message)}</span>${safeUrl&&announcement.linkLabel?`<a href="${esc(safeUrl)}">${esc(announcement.linkLabel)}</a>`:""}<button type="button" aria-label="Dismiss announcement">×</button></div>`;
    const anchor=document.querySelector("header.top,nav.sticky,header,nav")||document.body.firstElementChild;
    if(anchor&&anchor.parentNode)anchor.insertAdjacentElement("afterend",host);else document.body.prepend(host);
    host.querySelector("button").addEventListener("click",()=>{try{localStorage.setItem(dismissedKey,"1");}catch(_){}host.remove();});
  }
  function unpublishBoard(){
    if(board.published!==false)return;
    const page=/engines\.html$/i.test(location.pathname)?"full":"overview";
    const section=document.getElementById("board")||document.querySelector("main");if(!section)return;
    const notice=document.createElement("section");notice.className="p2u-board-unpublished";notice.setAttribute("role","status");
    notice.innerHTML=`<i class="fa-solid fa-clock" aria-hidden="true"></i><h2>Board temporarily unpublished</h2><p>${esc(board.message||"Today’s board is being prepared. Please check back shortly.")}</p>`;
    section.prepend(notice);
    const selectors=page==="full"?["#matches-grid","aside","#acca-note"]:["#date-strip","#engine-pills","#acca-root","#board-rank-reason","#cards","#show-all"];
    selectors.forEach(sel=>document.querySelectorAll(sel).forEach(el=>{if(!el.closest(".p2u-board-unpublished")){el.dataset.p2uAdminHidden="1";el.style.display="none";}}));
  }
  function cardId(card){return String(card.dataset.slipId||card.dataset.id||card.id||"").trim();}
  function moderateCard(card){
    if(!card||card.dataset.p2uModerated==="1")return;const id=cardId(card);if(!id)return;
    card.dataset.p2uModerated="1";
    if(hidden.has(id)){card.hidden=true;card.setAttribute("aria-hidden","true");return;}
    if(verified.has(id)){
      card.dataset.verified="true";
      if(!card.querySelector(".p2u-community-verified-admin")){
        const target=card.querySelector(".slip-top,.slip-user,.handle,strong")||card.firstElementChild||card;
        const badge=document.createElement("span");badge.className="p2u-community-verified-admin";badge.innerHTML='<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Verified';target.appendChild(badge);
      }
    }
  }
  function moderateCommunity(){
    if(!hidden.size&&!verified.size)return;
    const scan=()=>document.querySelectorAll(".slip-card,[data-slip-id]").forEach(moderateCard);scan();
    const roots=[document.getElementById("feed"),document.getElementById("my-slips"),document.getElementById("popular")].filter(Boolean);
    if(roots.length){const observer=new MutationObserver(scan);roots.forEach(root=>observer.observe(root,{childList:true,subtree:true}));}
  }
  function exposeFeatured(){
    document.documentElement.dataset.p2uAdminVersion=cfg.version||"";
    window.P2USiteControls={config:cfg,featuredEngines:[...(cfg.featured&&cfg.featured.engines||[])],featuredLeagues:[...(cfg.featured&&cfg.featured.leagues||[])]};
    window.dispatchEvent(new CustomEvent("p2u:admin-config",{detail:window.P2USiteControls}));
  }
  function init(){mountAnnouncement();unpublishBoard();moderateCommunity();exposeFeatured();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
