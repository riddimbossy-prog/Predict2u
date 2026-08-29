#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { parseSportyMarkets } = require('../sportybet-collect');

const markets = [
  { id: '1', name: '1X2', outcomes: [
    { desc: 'Home', odds: '1.39' }, { desc: 'Draw', odds: '5.90' }, { desc: 'Away', odds: '7.13' }
  ]},
  { id: '10', name: 'Double Chance', outcomes: [
    { desc: 'Home or Draw', odds: '1.12' }, { desc: 'Home or Away', odds: '1.15' }, { desc: 'Draw or Away', odds: '2.85' }
  ]},
  { id: '18', name: 'Over/Under', specifier: 'total=2.5', outcomes: [
    { desc: 'Over 2.5', odds: '1.36' }, { desc: 'Under 2.5', odds: '3.30' }
  ]},
  { id: '18', name: 'Over/Under', specifier: 'total=1.5', outcomes: [
    { desc: 'Over 1.5', odds: '1.11' }, { desc: 'Under 1.5', odds: '7.20' }
  ]},
  { id: '29', name: 'GG/NG', outcomes: [
    { desc: 'Yes', odds: '1.57' }, { desc: 'No', odds: '2.40' }
  ]}
];

const odds = parseSportyMarkets(markets);
assert.strictEqual(odds.home, 1.39);
assert.strictEqual(odds.dc1x, 1.12);
assert.strictEqual(odds.over25, 1.36);
assert.strictEqual(odds.over15, 1.11);
assert.strictEqual(odds.bttsYes, 1.57);
assert.strictEqual(odds.GG, 1.57);
assert.strictEqual(odds['1X'], 1.12);
console.log('sportybet-collect.test.js ok');
