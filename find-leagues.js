/* ============================================================
   FIND LEAGUE IDs — look up API-Football league IDs by country.
   Usage (in the black window):
     node find-leagues.js Nigeria
     node find-leagues.js "South Africa"
     node find-leagues.js Egypt
   It prints every league/cup that country has, with its ID,
   so you can paste the right number into config.txt LEAGUES.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const https = require("https");

function readKey() {
  const raw = fs.readFileSync(path.join(__dirname, "config.txt"), "utf8");
  const m = raw.match(/^\s*API_KEY\s*=\s*(.+)$/mi);
  if (!m) return "";
  return m[1].trim().replace(/['"*]/g, "").replace(/[^A-Za-z0-9\-]/g, "");
}
function apiGet(endpoint, key) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { method:"GET", hostname:"v3.football.api-sports.io", path:endpoint, headers:{ "x-apisports-key":key } },
      res => { let b=""; res.on("data",d=>b+=d); res.on("end",()=>{ try{resolve(JSON.parse(b));}catch(e){reject(e);} }); }
    );
    req.on("error", reject); req.end();
  });
}

(async () => {
  const country = process.argv.slice(2).join(" ").trim();
  if (!country) { console.log('Usage: node find-leagues.js <country>   e.g.  node find-leagues.js Nigeria'); process.exit(1); }
  const key = readKey();
  if (!key || key.includes("PASTE")) { console.log("Set your key first with set-key.bat."); process.exit(1); }
  console.log(`\nLooking up leagues for: ${country}\n`);
  try {
    const r = await apiGet(`/leagues?country=${encodeURIComponent(country)}`, key);
    const list = r.response || [];
    if (!list.length) { console.log("No leagues found. Check the country spelling (try the English name)."); return; }
    for (const item of list) {
      const L = item.league, C = item.country;
      const seasons = (item.seasons||[]).map(s=>s.year);
      const latest = seasons.length ? seasons[seasons.length-1] : "?";
      console.log(`  ID ${String(L.id).padEnd(5)} ${L.type.padEnd(6)} ${L.name}  (${C.name}, latest season ${latest})`);
    }
    console.log(`\nPaste the ID numbers you want into the LEAGUES line of config.txt.\n`);
  } catch (e) { console.log("Error: " + e.message); }
})();
