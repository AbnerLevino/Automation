'use strict';

const powershell = require('../services/powershell');

function mapAdapter(raw) {
  return {
    name: raw.Name ?? null,
    description: raw.InterfaceDescription ?? null,
    mac: raw.MacAddress ?? null,
    status: raw.Status ?? null,
  };
}

// Get-NetIPConfiguration devolve esses campos como objeto único, lista de objetos, ou já como
// string, dependendo da versão do Windows — por isso o unwrap recursivo.
function extractAddress(value, key) {
  if (Array.isArray(value)) {
    return value.length > 0 ? extractAddress(value[0], key) : null;
  }
  if (value && typeof value === 'object') {
    return value[key] ?? null;
  }
  return value ?? null;
}

function mapConfig(raw) {
  return {
    interfaceAlias: raw.InterfaceAlias ?? null,
    ipv4: extractAddress(raw.IPv4Address, 'IPAddress'),
    gateway: extractAddress(raw.IPv4DefaultGateway, 'NextHop'),
    dns: Array.isArray(raw.DNSServer)
      ? raw.DNSServer.flatMap((entry) => entry?.ServerAddresses ?? []).filter(Boolean)
      : [],
  };
}

async function getNetworkAdapters() {
  const result = await powershell.run('networkAdapters');
  if (!result.ok) return { ok: false, reason: result.reason, data: [] };
  return { ok: true, data: result.data.map(mapAdapter) };
}

async function getNetworkConfig() {
  const result = await powershell.run('networkConfig');
  if (!result.ok) return { ok: false, reason: result.reason, data: [] };
  return { ok: true, data: result.data.map(mapConfig) };
}

async function getNetwork() {
  const [adapters, config] = await Promise.all([getNetworkAdapters(), getNetworkConfig()]);
  return { adapters, config };
}

module.exports = { getNetworkAdapters, getNetworkConfig, getNetwork, mapAdapter, mapConfig };
