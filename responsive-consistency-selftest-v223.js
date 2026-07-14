const fs=require('fs'),path=require('path');const root=__dirname;const read=f=>fs.readFileSync(path.join(root,f),'utf8');const checks=[];function ok(name,pass){checks.push({name,pass:Boolean(pass)})}
const pages=['index.html','board.html','engines.html','proof.html','scorecards.html','league-dna.html','community.html','news.html','account.html','profile.html','trust.html','privacy.html','terms.html','disclaimer.html','responsible-gambling.html','404.html'];
for(const p of pages){const h=read(p);ok(`${p}: global shell`,h.includes('p2u-global-header'));ok(`${p}: global CSS`,h.includes('global-shell-v223.css'));ok(`${p}: global JS`,h.includes('global-shell-v223.js'));ok(`${p}: mobile nav`,h.includes('mobile-app-nav.js'))}
const css=read('global-shell-v223.css'),js=read('global-shell-v223.js'),mob=read('mobile-app-nav.js'),sw=read('sw.js');
for(const token of ['p2u-global-tabs','p2u-pages-overlay','@media(max-width:620px)','p2u-global-profile'])ok(`CSS ${token}`,css.includes(token));
for(const token of ['p2u:open-pages-menu','scrollIntoView','ResizeObserver','All Predict2U pages'])ok(`JS ${token}`,js.includes(token));
for(const token of ['Overview','Full Board','Proof','More'])ok(`Mobile ${token}`,mob.includes(token));
ok('service worker v223',sw.includes("predict2u-v223"));ok('new shell precached',sw.includes("'./global-shell-v223.css'")&&sw.includes("'./global-shell-v223.js'"));
const report={version:'v223',passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass),total:checks.length};fs.writeFileSync(path.join(root,'VALIDATION_v223.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failed.length)process.exit(1);
