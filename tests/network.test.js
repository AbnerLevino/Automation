'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mapAdapter, mapConfig } = require('../src/modules/network');

test('mapAdapter converts raw PowerShell object', () => {
  const raw = { Name: 'Ethernet', InterfaceDescription: 'Realtek', MacAddress: 'AA-BB-CC', Status: 'Up' };
  assert.deepEqual(mapAdapter(raw), {
    name: 'Ethernet',
    description: 'Realtek',
    mac: 'AA-BB-CC',
    status: 'Up',
  });
});

test('mapConfig extracts first IPv4 address, gateway and DNS list', () => {
  const raw = {
    InterfaceAlias: 'Ethernet',
    IPv4Address: [{ IPAddress: '192.168.0.10' }],
    IPv4DefaultGateway: [{ NextHop: '192.168.0.1' }],
    DNSServer: [{ ServerAddresses: ['8.8.8.8'] }],
  };
  const result = mapConfig(raw);
  assert.equal(result.ipv4, '192.168.0.10');
  assert.equal(result.gateway, '192.168.0.1');
  assert.deepEqual(result.dns, ['8.8.8.8']);
});

test('mapConfig marks missing fields explicitly, never inventing data', () => {
  const result = mapConfig({});
  assert.equal(result.ipv4, null);
  assert.equal(result.gateway, null);
  assert.deepEqual(result.dns, []);
});
