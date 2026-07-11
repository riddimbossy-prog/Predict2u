/* Predict2U v169 Admin Control Center.
   Static-site operator console: local privacy lock, public-health inspection,
   configuration drafting and safe export. Never stores repository tokens. */
(function(){
  "use strict";
  const VERSION="v169";
  const PIN_STORE="p2u-admin-pin-v169";
  const DRAFT_STORE="p2u-admin-draft-v169";
  const LOG_STORE="p2u-admin-log-v169";
  const SESSION_STORE="p2u-admin-session-v169";
  const MAX_LOGS=80;
  const defaults=normalize(window.P2U_ADMIN_CONFIG||{});
  let draft=loadDraft();
  let health=null,audit=null,buildVersion=VERSION,cacheVersion=VERSION;
  const $=sel=>document.querySelector(sel);
  const $$=sel=>[...document.querySelectorAll(sel)];

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function safeParse(value,fallback){try{return JSON.parse(value);}catch(_){return fallback;}}
  function normalize(raw){
    const base={version:VERSION,updatedAt:"",board:{published:true,message:"Today’s board is being prepared. Please check back shortly."},announcement:{enabled:false,tone:"info",message:"",linkLabel:"",linkUrl:"",expiresAt:""},featured:{engines:[],leagues:[]},community:{hiddenIds:[],verifiedIds:[]},operations:{repository:"https://github.com/riddimbossy-prog/golden-banker-v2",qualityWorkflow:"https://github.com/riddimbossy-prog/golden-banker-v2/actions/workflows/site-quality.yml",liveScoresWorkflow:"https://github.com/riddimbossy-prog/golden-banker-v2/actions/workflows/live-scores.yml"}};
    const out=Object.assign({},base,clone(raw||{}));
    out.board=Object.assign({},base.board,raw.board||{});
    out.announcement=Object.assign({},base.announcement,raw.announcement||{});
    out.featured=Object.assign({},base.featured,raw.featured||{});
    out.community=Object.assign({},base.community,raw.community||{});
    out.operations=Object.assign({},base.operations,raw.operations||{});
    out.featured.engines=unique(out.featured.engines);
    out.featured.leagues=unique(out.featured.leagues);
    out.community.hiddenIds=unique(out.community.hiddenIds);
    out.community.verifiedIds=unique(out.community.verifiedIds);
    return out;
  }
  function unique(values){return [...new Set((Array.isArray(values)?values:[]).map(v=>String(v).trim()).filter(Boolean))];}
  function loadDraft(){try{return normalize(safeParse(localStorage.getItem(DRAFT_STORE),defaults));}catch(_){return clone(defaults);}}
  function logs(){try{const rows=safeParse(localStorage.getItem(LOG_STORE),[]);return Array.isArray(rows)?rows:[];}catch(_){return[];}}
  function writeLogs(rows){try{localStorage.setItem(LOG_STORE,JSON.stringify(rows.slice(0,MAX_LOGS)));}catch(_){}}
  function log(action,detail=""){
    const rows=[{time:new Date().toISOString(),action:String(action),detail:String(detail||"").slice(0,180)}].concat(logs()).slice(0,MAX_LOGS);writeLogs(rows);renderLogs();
  }
  function persistDraft(action="Draft saved"){
    draft.updatedAt=new Date().toISOString();draft.version=VERSION;
    try{localStorage.setItem(DRAFT_STORE,JSON.stringify(draft));}catch(_){}
    if(action)log(action);renderConfigPreview();toast(action||"Saved");
  }
  function toast(message){const el=$("#toast");if(!el)return;el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2400);}
  function escapeHtml(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
  function formatAge(date){const t=Date.parse(date||"");if(!Number.isFinite(t))return"Unknown";const d=Math.max(0,Date.now()-t),m=Math.floor(d/60000);if(m<1)return"Now";if(m<60)return`${m}m`;const h=Math.floor(m/60);if(h<48)return`${h}h`;return`${Math.floor(h/24)}d`;}
  function statusClass(value){return value==="good"?"good":value==="bad"?"bad":"warn";}
  async function digest(text,salt){
    const data=new TextEncoder().encode(`${salt}:${text}`);
    const hash=await crypto.subtle.digest("SHA-256",data);
    return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }
  function randomSalt(){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");}
  function pinRecord(){try{return safeParse(localStorage.getItem(PIN_STORE),null);}catch(_){return null;}}
  function validPin(pin){return /^\d{4,12}$/.test(pin);}
  function configureGate(){
    const exists=Boolean(pinRecord());
    $("#gate-title").textContent=exists?"Unlock administration":"Create local operator PIN";
    $("#gate-copy").textContent=exists?"Enter the local operator PIN for this device.":"Create a 4–12 digit PIN to keep casual visitors out of this browser’s console.";
    $("#confirm-wrap").classList.toggle("hidden",exists);
    $("#admin-pin-confirm").required=!exists;
    $("#gate-submit").innerHTML=exists?'<i class="fa-solid fa-lock-open"></i> Unlock':'<i class="fa-solid fa-shield-halved"></i> Create PIN';
  }
  async function submitGate(event){
    event.preventDefault();
    const pin=$("#admin-pin").value.trim(),record=pinRecord();
    if(!validPin(pin)){toast("Use 4–12 digits");return;}
    if(!record){
      const confirm=$("#admin-pin-confirm").value.trim();if(pin!==confirm){toast("PINs do not match");return;}
      const salt=randomSalt(),hash=await digest(pin,salt);localStorage.setItem(PIN_STORE,JSON.stringify({salt,hash,createdAt:new Date().toISOString()}));log("Local operator PIN created");
    }else{
      const hash=await digest(pin,record.salt);if(hash!==record.hash){toast("Incorrect PIN");return;}
    }
    sessionStorage.setItem(SESSION_STORE,"1");showApp();
  }
  function showApp(){
    $("#admin-gate").classList.add("hidden");$("#admin-app").classList.remove("hidden");
    renderForm();renderLogs();loadStatus();
  }
  function lock(){sessionStorage.removeItem(SESSION_STORE);$("#admin-app").classList.add("hidden");$("#admin-gate").classList.remove("hidden");$("#admin-pin").value="";configureGate();}
  function switchSection(name){
    $$(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.section===name));
    $$("[data-section-panel]").forEach(x=>x.classList.toggle("active",x.dataset.sectionPanel===name));
    const map={overview:["Overview","System status and release information"],publishing:["Publishing","Board, announcement and featured content"],community:["Community","Verified and hidden public records"],operations:["Operations","Workflows, export and deployment"],audit:["Audit trail","Site audit and local operator actions"]};
    $("#top-title").textContent=map[name][0];$("#top-subtitle").textContent=map[name][1];closeSidebar();
  }
  function openSidebar(){$("#sidebar").classList.add("open");$("#mobile-backdrop").classList.add("open");}
  function closeSidebar(){$("#sidebar").classList.remove("open");$("#mobile-backdrop").classList.remove("open");}
  function engineNames(){return Array.isArray(window.P2U_ENGINE_REGISTRY)?window.P2U_ENGINE_REGISTRY.map(x=>x.name):["Normal","Strict","Ultra","Elite","Apex","Prime","Expert","Pro","Trend","Streaks","Mismatch","Halves","League Bias","Momentum","Odds Intelligence","Value"];}
  function renderForm(){
    $("#board-published").checked=draft.board.published!==false;$("#board-message").value=draft.board.message||"";
    $("#announcement-enabled").checked=Boolean(draft.announcement.enabled);$("#announcement-tone").value=draft.announcement.tone||"info";$("#announcement-message").value=draft.announcement.message||"";$("#announcement-link-label").value=draft.announcement.linkLabel||"";$("#announcement-link-url").value=draft.announcement.linkUrl||"";$("#announcement-expires").value=toLocalInput(draft.announcement.expiresAt);
    $("#featured-leagues").value=(draft.featured.leagues||[]).join("\n");
    $("#engine-grid").innerHTML=engineNames().map(name=>`<label class="engine-chip"><input type="checkbox" value="${escapeHtml(name)}" ${draft.featured.engines.includes(name)?"checked":""}/> <span>${escapeHtml(name)}</span></label>`).join("");
    $("#quality-link").href=draft.operations.qualityWorkflow;$("#scores-link").href=draft.operations.liveScoresWorkflow;$("#repo-link").href=draft.operations.repository;
    renderLeagueTags();renderModeration();renderAnnouncementPreview();renderConfigPreview();
  }
  function toLocalInput(value){if(!value)return"";const d=new Date(value);if(Number.isNaN(d.valueOf()))return"";const pad=n=>String(n).padStart(2,"0");return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}
  function collectForm(){
    draft.board.published=$("#board-published").checked;draft.board.message=$("#board-message").value.trim();
    draft.announcement.enabled=$("#announcement-enabled").checked;draft.announcement.tone=$("#announcement-tone").value;draft.announcement.message=$("#announcement-message").value.trim();draft.announcement.linkLabel=$("#announcement-link-label").value.trim();draft.announcement.linkUrl=$("#announcement-link-url").value.trim();const expires=$("#announcement-expires").value;draft.announcement.expiresAt=expires?new Date(expires).toISOString():"";
    draft.featured.engines=$$("#engine-grid input:checked").map(x=>x.value);draft.featured.leagues=unique($("#featured-leagues").value.split(/\r?\n|,/));
    renderLeagueTags();renderAnnouncementPreview();renderConfigPreview();
  }
  function renderLeagueTags(){const values=unique($("#featured-leagues")?$("#featured-leagues").value.split(/\r?\n|,/):draft.featured.leagues);$("#league-tags").innerHTML=values.length?values.map(x=>`<span class="tag">${escapeHtml(x)}</span>`).join(""): '<span class="muted" style="font-size:12px">No featured leagues selected.</span>';}
  function renderAnnouncementPreview(){
    const host=$("#announcement-preview");if(!host)return;const msg=$("#announcement-message").value.trim();if(!$("#announcement-enabled").checked||!msg){host.innerHTML='<div class="muted" style="font-size:12px;margin-top:10px">Announcement preview is off.</div>';return;}
    host.innerHTML=`<div class="preview-note"><span class="preview-dot"></span><span>${escapeHtml(msg)}</span>${$("#announcement-link-label").value.trim()?`<b style="color:var(--brand)">${escapeHtml($("#announcement-link-label").value.trim())}</b>`:""}</div>`;
  }
  function renderModeration(){
    const make=(id,items,type)=>{const host=$(id);host.innerHTML=items.length?items.map(v=>`<span class="tag">${escapeHtml(v)} <button type="button" data-remove-${type}="${escapeHtml(v)}" aria-label="Remove ${escapeHtml(v)}">×</button></span>`).join(""):'<span class="muted" style="font-size:12px">None added.</span>';};
    make("#verified-list",draft.community.verifiedIds,"verified");make("#hidden-list",draft.community.hiddenIds,"hidden");$("#verified-count").textContent=draft.community.verifiedIds.length;$("#hidden-count").textContent=draft.community.hiddenIds.length;
  }
  function addModeration(type){
    const input=type==="verified"?$("#verify-id"):$("#hide-id");const value=input.value.trim().replace(/\s+/g,"-");if(!value){toast("Enter a public slip ID");return;}
    const target=type==="verified"?draft.community.verifiedIds:draft.community.hiddenIds;const other=type==="verified"?draft.community.hiddenIds:draft.community.verifiedIds;
    if(other.includes(value)){toast("Remove this ID from the other list first");return;}
    if(!target.includes(value))target.push(value);input.value="";persistDraft(`${type==="verified"?"Verified":"Hidden"} Community ID added`);renderModeration();
  }
  function removeModeration(type,value){const target=type==="verified"?draft.community.verifiedIds:draft.community.hiddenIds;const i=target.indexOf(value);if(i>=0)target.splice(i,1);persistDraft(`${type} Community ID removed`);renderModeration();}
  function configObject(){const out=clone(draft);out.version=VERSION;out.updatedAt=new Date().toISOString();return out;}
  function configText(){return `/* Predict2U ${VERSION} operator configuration.\n   Generated by admin.html. Never add passwords, tokens or API keys. */\nwindow.P2U_ADMIN_CONFIG = Object.freeze(${JSON.stringify(configObject(),null,2)});\n`;}
  function renderConfigPreview(){const host=$("#config-preview");if(host)host.textContent=configText();}
  function download(name,text,type="text/plain"){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function downloadConfig(){collectForm();persistDraft("Admin configuration exported");download("admin-config.js",configText(),"text/javascript");}
  async function copyConfig(){collectForm();try{await navigator.clipboard.writeText(configText());toast("Configuration copied");log("Admin configuration copied");}catch(_){toast("Clipboard unavailable — use Download config");}}
  function supportBundle(){collectForm();const bundle={generatedAt:new Date().toISOString(),version:VERSION,buildVersion,cacheVersion,health,audit,configuration:configObject(),localLog:logs().slice(0,30),userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight}};download(`predict2u-support-${Date.now()}.json`,JSON.stringify(bundle,null,2),"application/json");log("Support bundle downloaded");}
  async function fetchJson(url){const res=await fetch(`${url}?admin=${Date.now()}`,{cache:"no-store"});if(!res.ok)throw new Error(`${res.status}`);return res.json();}
  async function fetchText(url){const res=await fetch(`${url}?admin=${Date.now()}`,{cache:"no-store"});if(!res.ok)throw new Error(`${res.status}`);return res.text();}
  async function loadStatus(){
    $("#top-status-text").textContent="Reading health…";
    const results=await Promise.allSettled([fetchJson("site-health.json"),fetchJson("site-audit.json"),fetchText("BUILD_VERSION.txt"),fetchText("sw.js")]);
    health=results[0].status==="fulfilled"?results[0].value:null;audit=results[1].status==="fulfilled"?results[1].value:null;buildVersion=results[2].status==="fulfilled"?results[2].value.trim():VERSION;
    const sw=results[3].status==="fulfilled"?results[3].value:"";const m=sw.match(/CACHE_VERSION\s*=\s*["']([^"']+)/);cacheVersion=m?m[1]:VERSION;
    renderStatus();renderAudit();
  }
  function healthUpdatedAt(){return health&&(health.generatedAt||health.updatedAt||health.lastUpdated||health.timestamp)||"";}
  function renderStatus(){
    $("#kpi-build").textContent=buildVersion||VERSION;$("#kpi-cache").textContent=`Cache ${cacheVersion}`;$("#operation-cache").textContent=cacheVersion.replace(/^predict2u-/i,"");
    const engines=Array.isArray(window.P2U_ENGINE_REGISTRY)?window.P2U_ENGINE_REGISTRY.length:16;$("#kpi-engines").textContent=`${engines}/16`;$("#kpi-engines").className=`kpi-value ${engines===16?"good":"bad"}`;
    const updated=healthUpdatedAt(),age=formatAge(updated),ageMs=Date.now()-Date.parse(updated||0),freshClass=Number.isFinite(ageMs)&&ageMs<=36*3600000?"good":Number.isFinite(ageMs)&&ageMs<=72*3600000?"warn":"bad";
    $("#kpi-freshness").textContent=updated?age:"Unknown";$("#kpi-freshness").className=`kpi-value ${freshClass}`;$("#kpi-freshness-meta").textContent=updated?`Snapshot ${new Date(updated).toLocaleString()}`:"site-health.json unavailable";
    const critical=audit&&Array.isArray(audit.critical)?audit.critical.length:null,warnings=audit&&Array.isArray(audit.warnings)?audit.warnings.length:null;$("#kpi-audit").textContent=critical==null?"Unknown":critical===0?"Clean":`${critical} critical`;$("#kpi-audit").className=`kpi-value ${critical===0?"good":critical==null?"warn":"bad"}`;$("#kpi-audit-meta").textContent=critical==null?"site-audit.json unavailable":`${warnings||0} warning(s) · ${audit.passedCount||0} checks passed`;
    const overall=critical===0&&freshClass!=="bad"&&engines===16;$("#top-status-text").textContent=overall?"System ready":"Review required";$("#top-status-dot").style.background=overall?"var(--brand)":"var(--gold)";
    const healthRows=[
      ["Public health file",health?"Loaded":"Unavailable",health?"good":"bad"],
      ["Data snapshot",updated?`${age} old`:"Unknown",freshClass],
      ["Engine registry",`${engines} engines`,engines===16?"good":"bad"],
      ["Site audit",critical==null?"Unavailable":critical===0?"No critical issues":`${critical} critical`,critical===0?"good":"bad"]
    ];
    $("#health-list").innerHTML=healthRows.map(r=>`<div class="health-row"><div><b>${escapeHtml(r[0])}</b><span>${escapeHtml(r[1])}</span></div><span class="health-pill ${statusClass(r[2])}">${r[2]==="good"?"Ready":r[2]==="bad"?"Action":"Watch"}</span></div>`).join("");
    const readyRows=[
      ["Board publication",draft.board.published?"Published":"Unpublished",draft.board.published?"good":"warn"],
      ["Announcement",draft.announcement.enabled?"Enabled":"Off",draft.announcement.enabled?"warn":"good"],
      ["Community hidden IDs",String(draft.community.hiddenIds.length),draft.community.hiddenIds.length?"warn":"good"],
      ["Local draft",draft.updatedAt?`Saved ${formatAge(draft.updatedAt)} ago`:"Using committed defaults","good"]
    ];
    $("#readiness-list").innerHTML=readyRows.map(r=>`<div class="health-row"><div><b>${escapeHtml(r[0])}</b><span>${escapeHtml(r[1])}</span></div><span class="health-pill ${statusClass(r[2])}">${r[2]==="good"?"Ready":"Review"}</span></div>`).join("");
  }
  function renderAudit(){
    const summary=$("#audit-summary"),details=$("#audit-details");if(!audit){summary.innerHTML='<span class="summary-pill bad">Audit unavailable</span>';details.innerHTML='<div class="no-data">site-audit.json could not be loaded.</div>';return;}
    const critical=Array.isArray(audit.critical)?audit.critical:[],warnings=Array.isArray(audit.warnings)?audit.warnings:[];
    summary.innerHTML=`<span class="summary-pill ${critical.length?"bad":"good"}">${critical.length} critical</span><span class="summary-pill">${warnings.length} warnings</span><span class="summary-pill good">${audit.passedCount||0} passed</span><span class="summary-pill">${escapeHtml(audit.auditVersion||"")}</span>`;
    const items=critical.map(x=>[x,"Critical","bad"]).concat(warnings.map(x=>[x,"Warning","warn"])).slice(0,20);details.innerHTML=items.length?items.map(x=>`<div class="health-row"><div><b>${escapeHtml(x[0])}</b></div><span class="health-pill ${x[2]}">${x[1]}</span></div>`).join(""):'<div class="health-row"><div><b>No audit issues reported</b><span>The latest committed audit snapshot is clean.</span></div><span class="health-pill good">Clean</span></div>';
  }
  function renderLogs(){const host=$("#log-list");if(!host)return;const rows=logs();host.innerHTML=rows.length?rows.map(row=>`<div class="log-row"><div><b>${escapeHtml(row.action)}</b><span>${escapeHtml(row.detail||new Date(row.time).toLocaleString())}</span></div><span>${escapeHtml(formatAge(row.time))}</span></div>`).join(""):'<div class="no-data">No local actions yet.</div>';}
  function resetDraft(){draft=clone(defaults);try{localStorage.removeItem(DRAFT_STORE);}catch(_){}renderForm();renderStatus();log("Local draft reset to committed configuration");toast("Draft reset");}
  function clearLocal(){if(!confirm("Clear the local operator PIN, draft and action log on this device?"))return;[PIN_STORE,DRAFT_STORE,LOG_STORE].forEach(k=>localStorage.removeItem(k));sessionStorage.removeItem(SESSION_STORE);draft=clone(defaults);lock();toast("Local admin data cleared");}
  function bind(){
    $("#gate-form").addEventListener("submit",submitGate);$("#lock-admin").addEventListener("click",lock);$("#mobile-menu").addEventListener("click",openSidebar);$("#mobile-backdrop").addEventListener("click",closeSidebar);
    $$(".nav-btn").forEach(b=>b.addEventListener("click",()=>switchSection(b.dataset.section)));
    $("#save-draft").addEventListener("click",()=>{collectForm();persistDraft();renderStatus();});$("#refresh-status").addEventListener("click",()=>{loadStatus();toast("Status refreshed");});$("#download-support").addEventListener("click",supportBundle);
    ["#board-published","#board-message","#announcement-enabled","#announcement-tone","#announcement-message","#announcement-link-label","#announcement-link-url","#announcement-expires","#featured-leagues"].forEach(sel=>$(sel).addEventListener("input",()=>{collectForm();renderStatus();}));
    $("#engine-grid").addEventListener("change",collectForm);$("#preview-config").addEventListener("click",()=>{collectForm();renderAnnouncementPreview();toast("Preview updated");});
    ["#download-config","#download-config-community","#download-config-2"].forEach(sel=>$(sel).addEventListener("click",downloadConfig));$("#copy-config").addEventListener("click",copyConfig);
    $("#add-verified").addEventListener("click",()=>addModeration("verified"));$("#add-hidden").addEventListener("click",()=>addModeration("hidden"));
    $("#verified-list").addEventListener("click",e=>{const b=e.target.closest("[data-remove-verified]");if(b)removeModeration("verified",b.dataset.removeVerified);});$("#hidden-list").addEventListener("click",e=>{const b=e.target.closest("[data-remove-hidden]");if(b)removeModeration("hidden",b.dataset.removeHidden);});
    $("#reset-draft").addEventListener("click",resetDraft);$("#clear-local").addEventListener("click",clearLocal);$("#clear-log").addEventListener("click",()=>{writeLogs([]);renderLogs();toast("Local log cleared");});
    addEventListener("keydown",e=>{if(e.key==="Escape")closeSidebar();});
  }
  function signalReady(){document.documentElement.dataset.p2uAdminReady='true';window.dispatchEvent(new CustomEvent('p2u:admin-ready',{detail:{version:VERSION}}));}
  function init(){bind();configureGate();if(sessionStorage.getItem(SESSION_STORE)==="1")showApp();signalReady();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
