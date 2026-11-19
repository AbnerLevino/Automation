'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mapComputer, bytesToGB, uptimeFromBoot } = require('../src/modules/computer');

test('bytesToGB converts KB to GB with one decimal', () => {
  assert.equal(bytesToGB(16_777_216), 16);
});

test('bytesToGB returns null for non-numeric input', () => {
  assert.equal(bytesToGB(undefined), null);
});

test('uptimeFromBoot returns null when boot time is missing', () => {
  assert.equal(uptimeFromBoot(null), null);
});

test('uptimeFromBoot formats hours and days', () => {
  const twoDaysAgo = new Date(Date.now() - 50 * 3_600_000).toISOString();
  assert.equal(uptimeFromBoot(twoDaysAgo), '2d 2h');
});

test('mapComputer marks missing fields explicitly as null', () => {
  const result = mapComputer({});
  assert.equal(result.name, null);
  assert.equal(result.ramGB, null);
  assert.equal(result.uptime, null);
});
