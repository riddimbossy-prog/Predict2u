#!/usr/bin/env node
'use strict';
const fs=require('fs');
const cp=require('child_process');
const assert=require('assert');
const vm=require('vm');
const read=f=>fs.readFileSync(f,'utf8');
cp.execFileSync(process.execPath,['generated-data-hoist-selftest-v276.js'],{stdio:'inherit'});
for(const file of ['compact-generated-data.js','build-public-data.js','governance-supervisor.js','engine-consensus.js','sw.js']){
  cp.execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
assert(read('compact-generated-data.js').includes('P2U_GOVERNANCE_CONTEXT'));
assert(read('build-public-data.js').includes('sharedGovernance'));
assert(read('governance-supervisor.js').includes('globalThis.P2U_GOVERNANCE_CONTEXT'));
assert(read('engine-consensus.js').includes('globalThis.P2U_GOVERNANCE_CONTEXT'));
assert(read('BUILD_VERSION.txt').trim()==='v276');
assert(read('sw.js').includes("const CACHE_VERSION='predict2u-v276'"));
const sandbox={};sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.runInNewContext('window.P2U_GOVERNANCE_CONTEXT={defaultPolicy:"SHADOW",enginePolicies:{Trend:{state:"APPROVED",reason:"test"}}};',sandbox);
vm.runInNewContext(read('governance-supervisor.js'),sandbox);
assert(sandbox.P2UGovernanceSupervisor.policyFor({engine:'Trend'},{}).state==='APPROVED');
vm.runInNewContext(read('engine-consensus.js'),sandbox);
const resolved=sandbox.P2USmartConsensus.resolve({match:{},outputs:[{engine:'Trend',bet:true,primary:'Over 1.5',confidence:90,dataQuality:90},{engine:'Halves',bet:true,primary:'Over 1.5',confidence:90,dataQuality:90}]});
assert(resolved&&resolved.version==='v195');
console.log('Predict2U v276 release gate passed');
