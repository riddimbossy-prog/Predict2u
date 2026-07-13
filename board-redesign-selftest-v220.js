#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=__dirname,read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[];const check=(name,pass,detail='')=>{checks.push({name,pass:!!pass,detail});if(!pass)console.error('FAIL:',name,detail)};
const version=read('BUILD_VERSION.txt').trim();
const css=read('board-redesign-v220.css'),sw=read('sw.js');
for(const file of ['index.html','board.html']){
  const html=read(file);
  check(`${file}: redesign stylesheet loaded`,html.includes('board-redesign-v220.css'));
  check(`${file}: premium board shell`,html.includes('class="p2u-board-shell pb-16"')&&html.includes('p2u-board-head'));
  check(`${file}: board filter chips`,['data-board-view="all"','data-board-view="value"','data-board-view="confidence"'].every(x=>html.includes(x)));
  check(`${file}: league and search controls preserved`,html.includes('id="f-league"')&&html.includes('id="f-search"'));
  check(`${file}: redesigned match template`,['p2u-match-meta','p2u-matchup','p2u-prediction-panel','p2u-support-track'].every(x=>html.includes(x)));
  check(`${file}: horizontal action labels`,html.includes('<span>Details</span>')&&html.includes('<span>Proof</span>'));
  check(`${file}: functional view filters`,html.includes("boardView==='value'")&&html.includes("boardView==='confidence'")&&html.includes("data-board-view"));
  check(`${file}: filter drawer interaction`,html.includes("filterPanel.classList.toggle('is-open',open)"));
  const inline=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  let parse=true,detail='';
  inline.forEach((m,i)=>{if(!parse)return;try{new Function(m[1])}catch(e){parse=false;detail=`inline ${i+1}: ${e.message}`}});
  check(`${file}: inline scripts parse`,parse,detail);
}
check('desktop cards use three columns',/#board #cards\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/.test(css));
check('tablet cards use two columns',/@media\(max-width:1099px\)[\s\S]*?#board #cards\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/.test(css));
check('phone cards use one column',/@media\(max-width:699px\)[\s\S]*?#board #cards\{grid-template-columns:1fr!important/.test(css));
check('narrow phone actions use two columns',/@media\(max-width:389px\)[\s\S]*?p2u-card-actions\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/.test(css));
check('desktop actions support four buttons',/p2u-card-actions\{display:grid!important;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/.test(css));
check('service worker version matches build',sw.includes(`const VERSION='${version}';`)&&sw.includes(`predict2u-${version}`));
check('redesign stylesheet is precached',sw.includes("'./board-redesign-v220.css'"));
const failed=checks.filter(x=>!x.pass);
const report={version,generatedAt:new Date().toISOString(),passed:checks.length-failed.length,failed:failed.length,checks};
fs.writeFileSync(path.join(root,'VALIDATION_v220.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({version,passed:report.passed,failed:report.failed},null,2));
if(failed.length)process.exit(1);
