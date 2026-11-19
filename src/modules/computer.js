'use strict';

const powershell = require('../services/powershell');

function bytesToGB(kb) {
  if (typeof kb !== 'number') return null;
  return Math.round((kb / (1024 * 1024)) * 10) / 10;
}

function uptimeFromBoot(bootTimeRaw) {
  if (!bootTimeRaw) return null;
  const bootTime = new Date(bootTimeRaw);
  if (Number.isNaN(bootTime.getTime())) return null;
  const diffMs = Date.now() - bootTime.getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return days > 0 ? `${days}d ${remainingHours}h` : `${remainingHours}h`;
}

function mapComputer(raw) {
  return {
    name: raw.CsName ?? null,
    osName: raw.OsName ?? null,
    osVersion: raw.OsVersion ?? null,
    architecture: raw.OsArchitecture ?? null,
    manufacturer: raw.CsManufacturer ?? null,
    model: raw.CsModel ?? null,
    ramGB: bytesToGB(raw.OsTotalVisibleMemorySize),
    uptime: uptimeFromBoot(raw.OsLastBootUpTime),
  };
}

async function getComputerInfo() {
  const result = await powershell.run('computerInfo', { timeoutMs: 20000 });
  if (!result.ok) {
    return { ok: false, reason: result.reason, data: null };
  }
  return { ok: true, data: mapComputer(result.data[0] ?? {}) };
}

module.exports = { getComputerInfo, mapComputer, bytesToGB, uptimeFromBoot };
