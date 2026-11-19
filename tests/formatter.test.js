'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const formatter = require('../src/utils/formatter');

test('naText marks missing values explicitly, never inventing data', () => {
  assert.equal(formatter.naText(null), 'não disponível');
  assert.equal(formatter.naText(undefined), 'não disponível');
  assert.equal(formatter.naText(''), 'não disponível');
  assert.equal(formatter.naText('X'), 'X');
});

test('printerLines formats name, status, port and flags', () => {
  const lines = formatter.printerLines([
    { name: 'HP', status: 'Normal', port: 'USB001', isDefault: true, isShared: false },
  ]);
  assert.equal(lines[0], 'HP — status: Normal — porta: USB001 (padrão)');
});

test('computerLines marks missing RAM explicitly', () => {
  const lines = formatter.computerLines({
    name: 'PC01',
    osName: null,
    osVersion: null,
    architecture: null,
    manufacturer: null,
    model: null,
    ramGB: null,
    uptime: null,
  });
  assert.ok(lines.some((line) => line.includes('não disponível')));
});
