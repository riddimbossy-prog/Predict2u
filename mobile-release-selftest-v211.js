#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=__dirname;
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const checks=[];
function check(name,ok,detail=''){
  const row={name,ok:Boolean(ok),detail};checks.push(row);
  if(!row.ok)console.error(`FAIL: ${name}${detail?` — ${detail}`:''}`);
}
const css=read('mobile-polish-v211.css');
const board=read('board.html');
const index=read('index.html');
const sw=read('sw.js');
for(const [name,html] of [['board',board],['index',index]]){
  check(`${name}: viewport-fit cover`,/viewport-fit=cover/.test(html));
  check(`${name}: v211 CSS linked`,html.includes('mobile-polish-v211.css'));
  check(`${name}: v211 CSS loads after Acca CSS`,html.indexOf('mobile-polish-v211.css')>html.indexOf('acca-mobile-v209.css'));
  check(`${name}: engine avatar stack markup`,html.includes('p2u-engine-avatar-stack'));
  check(`${name}: engine activity copy markup`,html.includes('p2u-engine-activity-copy'));
  check(`${name}: active count remains dynamic`,html.includes("$('s-engines').textContent=`${active.length}/${TOTAL}`;"));
}
check('CSS: phone breakpoint',css.includes('@media (max-width:639px)'));
check('CSS: Fold-cover breakpoint',css.includes('@media (max-width:340px)'));
check('CSS: tablet and unfolded Fold breakpoint',css.includes('@media (min-width:640px) and (max-width:1180px)'));
check('CSS: action grid is 2 columns',/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(css));
check('CSS: action labels cannot wrap',/white-space:nowrap!important/.test(css));
check('CSS: action controls have touch height',/min-height:46px!important/.test(css));
check('CSS: engine summary stacks on phone',/flex-direction:column/.test(css));
check('CSS: market has separate price column',/\.p2u-standard-card \.p2u-card-market\s*\{[\s\S]*grid-template-columns:minmax\(0,1fr\) auto/.test(css));
check('CSS: no forced document overflow rule',!css.includes('min-width:600px'));
check('SW: v211 version',sw.includes("const VERSION='v211';"));
check('SW: v211 cache',sw.includes("const CACHE_VERSION='predict2u-v211';"));
check('SW: mobile CSS precached',sw.includes("'./mobile-polish-v211.css'"));
for(const file of ['board.html','index.html']){
  const html=read(file),re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match,count=0,ok=true,detail='';
  while((match=re.exec(html))){count++;try{new Function(match[1]);}catch(error){ok=false;detail=`inline script ${count}: ${error.message}`;break;}}
  check(`${file}: inline JavaScript parses`,ok,detail);
}
const failed=checks.filter(x=>!x.ok);
const report={build:'v211',generated_at:new Date().toISOString(),passed:checks.length-failed.length,failed:failed.length,viewports_required:[320,360,393,768,884,1180],checks};
fs.writeFileSync(path.join(root,'mobile-release-report-v211.json'),JSON.stringify(report,null,2));
if(failed.length){console.error(`${failed.length} mobile release checks failed.`);process.exit(1);}
console.log(`Mobile release self-test passed: ${checks.length} checks across phone, Fold and tablet rules.`);
