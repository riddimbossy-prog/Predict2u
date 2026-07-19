#!/usr/bin/env node
/* Predict2U v264 — removes secret/runtime files that must never ship in the public repository. */
'use strict';
const fs=require('fs'),path=require('path');const root=__dirname;
const targets=['config.txt','.env','.env.local','api-cache.json','odds-api-cache.json','backup-originals'];
let removed=0;
for(const rel of targets){const full=path.join(root,rel);if(!fs.existsSync(full))continue;fs.rmSync(full,{recursive:true,force:true});console.log(`Removed ${rel}`);removed++;}
console.log(removed?`Production cleanup complete: ${removed} unsafe/obsolete item(s) removed.`:'Production cleanup complete: nothing unsafe was present.');
