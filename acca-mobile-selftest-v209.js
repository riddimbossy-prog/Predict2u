#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=__dirname;
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const checks=[];
const check=(name,ok)=>{checks.push({name,ok:Boolean(ok)});if(!ok)console.error(`FAIL: ${name}`)};
const css=read('acca-mobile-v209.css');
const board=read('board.html');
const index=read('index.html');
const sw=read('sw.js');

for(const [name,html] of [['board.html',board],['index.html',index]]){
  check(`${name} loads Acca repair after shared responsive CSS`,
    html.indexOf('acca-mobile-v209.css')>html.indexOf('device-responsive-v207.css'));
  check(`${name} uses semantic Acca card`,html.includes('p2u-acca-card'));
  check(`${name} exposes fixture names`,html.includes('p2u-acca-teams'));
  check(`${name} separates market from fixture`,html.includes('p2u-acca-market'));
  check(`${name} replaces giant unpriced dash`,html.includes("${priced?comb.toFixed(2):'Not priced'}"));
}
check('mobile leg grid has dedicated areas',css.includes('grid-template-areas:')&&css.includes('"number fixture odds"')&&css.includes('"number market market"'));
check('mobile warning uses shorter copy',css.includes('.p2u-acca-warning-full{display:none}')&&css.includes('.p2u-acca-warning-mobile{display:inline}'));
check('mobile slip button is full width',/#acca-root \.p2u-acca-add\{[\s\S]*?width:100%/.test(css));
check('fixture names wrap instead of collapsing',/#acca-root \.p2u-acca-teams\{[\s\S]*?white-space:normal/.test(css));
check('market text wraps safely',/#acca-root \.p2u-acca-market\{[\s\S]*?white-space:normal/.test(css));
check('unpriced total uses readable text size',css.includes('.p2u-acca-total-value.is-unpriced'));
check('external icon is not required',board.includes('<span class="p2u-acca-warning-icon"')&&!board.includes('<i class="fa-solid fa-triangle-exclamation mt-0.5"'));
check('v209 build version',read('BUILD_VERSION.txt').trim()==='v209');
check('v209 service worker cache',sw.includes("CACHE_VERSION='predict2u-v209'"));
check('service worker precaches Acca CSS',sw.includes("'./acca-mobile-v209.css'"));

const failed=checks.filter(item=>!item.ok);
if(failed.length){console.error(`${failed.length} of ${checks.length} Acca mobile checks failed.`);process.exit(1)}
console.log(`Acca mobile self-test passed: ${checks.length} checks.`);
