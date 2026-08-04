#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const workflowDir = path.join(__dirname, '.github', 'workflows');
const required = [
  'fixture-snapshot.yml',
  'future-fixtures.yml',
  'auto-picks-learning.yml',
  'live-scores.yml',
  'odds-api-refresh.yml'
];

const failures = [];
for (const file of required) {
  const fullPath = path.join(workflowDir, file);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${file}: missing`);
    continue;
  }
  const source = fs.readFileSync(fullPath, 'utf8');
  if (/fetch-depth:\s*0\b/.test(source)) {
    failures.push(`${file}: still requests full Git history`);
  }
  const checkoutCount = (source.match(/uses:\s*actions\/checkout@v4/g) || []).length;
  const shallowCount = (source.match(/fetch-depth:\s*1\b/g) || []).length;
  if (checkoutCount === 0) {
    failures.push(`${file}: no checkout step found`);
  } else if (shallowCount < checkoutCount) {
    failures.push(`${file}: ${checkoutCount} checkout step(s), but only ${shallowCount} shallow checkout setting(s)`);
  }
}

const snapshot = fs.readFileSync(path.join(workflowDir, 'fixture-snapshot.yml'), 'utf8');
if (!/cron:\s*["']5 \*\/6 \* \* \*["']/.test(snapshot)) {
  failures.push('fixture-snapshot.yml: six-hour schedule missing');
}
if (!/timeout-minutes:\s*30\b/.test(snapshot)) {
  failures.push('fixture-snapshot.yml: expected 30-minute safety timeout missing');
}

if (failures.length) {
  console.error('Predict2U v274 checkout self-test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Predict2U v274 checkout self-test passed.');
console.log('All data-publishing workflows use shallow Git checkout and no workflow requests full repository history.');
