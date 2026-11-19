'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mapDriver } = require('../src/modules/drivers');

test('mapDriver converts raw PowerShell object into normalized shape', () => {
  const raw = {
    Name: 'HP Universal',
    Manufacturer: 'HP',
    DriverVersion: '1.0.0.0',
    PrinterEnvironment: 'Windows x64',
  };
  assert.deepEqual(mapDriver(raw), {
    name: 'HP Universal',
    manufacturer: 'HP',
    version: '1.0.0.0',
    environment: 'Windows x64',
  });
});

test('mapDriver marks missing fields explicitly as null', () => {
  assert.deepEqual(mapDriver({}), { name: null, manufacturer: null, version: null, environment: null });
});
