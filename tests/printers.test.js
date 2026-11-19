'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mapPrinter } = require('../src/modules/printers');

test('mapPrinter converts raw PowerShell object into normalized shape', () => {
  const raw = {
    Name: 'HP LaserJet',
    DriverName: 'HP Universal',
    PortName: 'USB001',
    Shared: false,
    Default: true,
    PrinterStatus: 'Normal',
  };
  assert.deepEqual(mapPrinter(raw), {
    name: 'HP LaserJet',
    driverName: 'HP Universal',
    port: 'USB001',
    isShared: false,
    isDefault: true,
    status: 'Normal',
  });
});

test('mapPrinter marks missing fields explicitly as null, never inventing data', () => {
  const result = mapPrinter({});
  assert.equal(result.name, null);
  assert.equal(result.status, null);
  assert.equal(result.isDefault, null);
});
