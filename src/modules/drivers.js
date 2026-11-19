'use strict';

const powershell = require('../services/powershell');

function mapDriver(raw) {
  return {
    name: raw.Name ?? null,
    manufacturer: raw.Manufacturer ?? null,
    version: raw.DriverVersion ?? null,
    environment: raw.PrinterEnvironment ?? null,
  };
}

async function getDrivers() {
  const result = await powershell.run('printerDrivers');
  if (!result.ok) {
    return { ok: false, reason: result.reason, data: [] };
  }
  return { ok: true, data: result.data.map(mapDriver) };
}

module.exports = { getDrivers, mapDriver };
