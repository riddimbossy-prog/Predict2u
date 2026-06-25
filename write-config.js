const fs = require("fs");
const path = require("path");
let raw = process.argv.slice(2).join(" ");
const token = raw.replace(/['"*]/g, "").replace(/[^A-Za-z0-9\-]/g, "");
if (!token) { console.log("No token detected. Run set-key.bat again and paste your token."); process.exit(1); }
let leagues = "1,2,3,39,140,135,78,61,88,94,144,203,71,128,253,307", season = "2026";
try {
  const old = fs.readFileSync(path.join(__dirname,"config.txt"),"utf8");
  const ml = old.match(/^\s*LEAGUES\s*=\s*(.+)$/mi); if (ml && ml[1].trim()) leagues = ml[1].trim();
  const ms = old.match(/^\s*SEASON\s*=\s*(.+)$/mi); if (ms && ms[1].trim()) season = ms[1].trim();
} catch (e) {}
const out = `# ============================================================
# GOLDEN BANKER — CONFIG  (API-Football / api-sports.io)
# Written automatically by set-key.bat.
# ============================================================

API_KEY=${token}

SEASON=${season}

# LEAGUES = numeric IDs. 1=World Cup 39=PL 140=LaLiga 135=SerieA
#           78=Bundesliga 61=Ligue1 2=Champions League 71=Brazil
LEAGUES=${leagues}
`;
fs.writeFileSync(path.join(__dirname,"config.txt"), out, "utf8");
console.log(`Saved config.txt with token ${token.length<=8?token:token.slice(0,4)+"…"+token.slice(-4)} (length ${token.length}).`);
