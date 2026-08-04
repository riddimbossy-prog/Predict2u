#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=__dirname;
const errors=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

for(const file of [
  'team-rankings.html','team-rankings.js','fixture-overlay.js','fixtures.js',
  'sw.js','.github/workflows/fixture-snapshot.yml','.github/workflows/future-fixtures.yml'
]){
  if(!fs.existsSync(path.join(root,file))) errors.push(`Missing ${file}`);
}

if(!errors.length){
  const html=read('team-rankings.html');
  const fixtureIndex=html.indexOf('<script src="fixtures.js"></script>');
  const dataIndex=html.indexOf('<script src="current-data.js"></script>');
  const overlayIndex=html.indexOf('<script src="fixture-overlay.js"></script>');
  const rankingsIndex=html.indexOf('<script src="team-rankings.js"></script>');
  if(!(fixtureIndex>=0&&fixtureIndex<dataIndex&&dataIndex<overlayIndex&&overlayIndex<rankingsIndex)){
    errors.push('Team Intelligence must load fixtures.js, current-data.js and fixture-overlay.js before team-rankings.js.');
  }

  const sw=read('sw.js');
  if(!sw.includes("const VERSION='v273'")) errors.push('Service worker version is not v273.');
  if(!sw.includes("'./fixtures.js'")) errors.push('fixtures.js is not included in the service-worker shell.');
  if(!/(?:data\\.js\|current-data\\.js\|data-meta\\.json\|fixtures\\.js)/.test(sw)){
    errors.push('fixtures.js is not protected by the network-first data route.');
  }

  const snapshot=read('.github/workflows/fixture-snapshot.yml');
  if(!/schedule:\s*\n\s*- cron: ["']5 \*\/6 \* \* \*["']/.test(snapshot)){
    errors.push('Fixture snapshot is not scheduled every six hours.');
  }

  const future=read('.github/workflows/future-fixtures.yml');
  if(!/schedule:\s*\n\s*- cron: ["']20 0 \* \* \*["']/.test(future)){
    errors.push('Full future-fixture discovery is not scheduled daily.');
  }
}

if(errors.length){
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Predict2U v273 future-date patch self-test passed.');
