#!/usr/bin/env node
/* probe-markets.js — does API-Football return the ODDS the Market Indicator
 * Engine needs (first-half 1X2, FH O/U, NG/GG, GG2+, goals-streak) for YOUR
 * leagues? Lists every bet name the bookmakers actually offer for a sample of
 * your matches. Writes nothing. Reads API_KEY from config.txt / env.
 * USAGE: node probe-markets.js   |   node probe-markets.js --leagues 39,140 */
const fs=require("fs"), path=require("path"), https=require("https");
const HERE=__dirname;

function loadKey(){
  for(const v of ["API_FOOTBALL_KEY","API_KEY","APIFOOTBALL_KEY"]) if(process.env[v]&&process.env[v].trim()) return process.env[v].trim();
  try{ const raw=fs.readFileSync(path.join(HERE,"config.txt"),"utf8"); const m=raw.match(/(?:API_KEY|API_FOOTBALL_KEY|TOKEN)\s*=\s*(\S+)/i); if(m) return m[1].trim(); }catch(e){}
  return null;
}
function apiGet(endpoint,key){
  return new Promise((res,rej)=>{
    const r=https.request({method:"GET",hostname:"v3.football.api-sports.io",path:endpoint,headers:{"x-apisports-key":key}},x=>{
      let b="";x.on("data",d=>b+=d);x.on("end",()=>{ if(x.statusCode===429){rej(new Error("RATE_LIMIT"));return;} try{res(JSON.parse(b));}catch(e){rej(new Error("bad JSON"));} });
    }); r.on("error",rej); r.end();
  });
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const SPEC={
  "First-Half 1X2":       /first half winner|1st half.*(winner|result)|halftime result|ht result/i,
  "First-Half Over/Under":/first half.*over\/under|1st half.*over\/under|halftime.*over\/under|goals.*1st half/i,
  "No Goal / BTTS":       /both teams.*score|btts|goal.*goal|^gg|^ng/i,
  "GG2+ / Multigoals":    /multi ?goals?|multiscore|exact goals|gg 2|both teams.*2/i,
  "Goals-Streak / Team":  /team.*over|home.*over.*goals|away.*over.*goals|to score.*2/i,
  "Double Chance":        /double chance/i,
};

(async function(){
  const args=process.argv.slice(2);
  const leaguesArg=(()=>{const i=args.indexOf("--leagues");return i>=0?(args[i+1]||"").split(",").map(s=>parseInt(s.trim(),10)).filter(Boolean):null;})();
  const key=loadKey(); if(!key){console.error("No API key. Set API_KEY in config.txt / env. Don't paste keys into chat.");process.exit(1);}

  console.log("\nMarket-availability probe (writes nothing)\n");
  const ping=await apiGet("/status",key);
  if(ping&&ping.errors&&Object.keys(ping.errors).length){console.error("API error:",JSON.stringify(ping.errors));process.exit(1);}
  const acct=ping&&ping.response&&ping.response.requests; if(acct)console.log(`Auth OK. Requests today: ${acct.current}/${acct.limit_day}.\n`);

  let targets=leaguesArg, season=new Date().getFullYear();
  if(!targets){ try{ const M=JSON.parse(fs.readFileSync(path.join(HERE,"data.js"),"utf8").match(/window\.MATCHES\s*=\s*(\[[\s\S]*?\]);?\s*$/)[1]);
    targets=[...new Set(M.map(m=>m.leagueId).filter(Boolean))].slice(0,6);
    const ss=M.map(m=>m.season).filter(Boolean); if(ss.length)season=ss.sort((a,b)=>b-a)[0]; }catch(e){} }
  if(!targets||!targets.length){console.error("No leagues. Pass --leagues 39,140 or run where data.js exists.");process.exit(1);}
  console.log(`Sampling ${targets.length} league(s), season ${season}.\n`);

  const allBetNames=new Map();
  const specHits={}; for(const k of Object.keys(SPEC)) specHits[k]=0;
  let leaguesWithOdds=0, calls=0;

  for(const leagueId of targets){
    let fx=null;
    try{ const r=await apiGet(`/fixtures?league=${leagueId}&season=${season}&next=3`,key); calls++; fx=(r.response||[])[0]; }catch(e){}
    if(!fx){ console.log(`  league ${leagueId}: no upcoming fixture to price`); continue; }
    const fid=fx.fixture.id;
    let odds=null;
    try{ const r=await apiGet(`/odds?fixture=${fid}`,key); calls++; odds=r.response&&r.response[0]; }catch(e){}
    if(!odds||!odds.bookmakers||!odds.bookmakers.length){ console.log(`  ${fx.league.name}: no odds returned yet`); await sleep(300); continue; }
    leaguesWithOdds++;

    const namesHere=new Set();
    for(const bk of odds.bookmakers) for(const bet of (bk.bets||[])) namesHere.add(bet.name);
    for(const nm of namesHere){ allBetNames.set(nm,(allBetNames.get(nm)||0)+1);
      for(const [spec,re] of Object.entries(SPEC)) if(re.test(nm)) specHits[spec]++; }
    console.log(`  ${fx.league.name}: ${namesHere.size} distinct markets offered`);
    await sleep(300);
  }

  console.log("\n================= SPEC-MARKET AVAILABILITY =================");
  for(const [spec,cnt] of Object.entries(specHits))
    console.log(`  ${cnt>0?"[YES]":"[NO] "} ${spec}: found in ${cnt}/${leaguesWithOdds} sampled leagues`);
  console.log("\nAll distinct bet names seen (exactly what IS available):");
  [...allBetNames.entries()].sort((a,b)=>b[1]-a[1]).forEach(([n,c])=>console.log(`   (${c}) ${n}`));
  console.log("\nVERDICT: if First-Half and GG2+/streak rows show [NO], the full odds");
  console.log("engine isn't buildable on this data — we build the STATISTICAL version.");
  console.log(`Probe used ${calls} API calls.`);
  console.log("===========================================================\n");
})().catch(e=>{console.error("Fatal:",e.message);process.exit(1);});
