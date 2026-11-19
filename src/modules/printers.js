'use strict';

const powershell = require('../services/powershell');

function mapPrinter(raw) {
  return {
    name: raw.Name ?? null,
    driverName: raw.DriverName ?? null,
    port: raw.PortName ?? null,
    isShared: typeof raw.Shared === 'boolean' ? raw.Shared : null,
    isDefault: typeof raw.Default === 'boolean' ? raw.Default : null,
    status: raw.PrinterStatus === undefined || raw.PrinterStatus === null ? null : String(raw.PrinterStatus),
  };
}

async function getPrinters() {
  const result = await powershell.run('printers');
  if (!result.ok) {
    return { ok: false, reason: result.reason, data: [] };
  }
  return { ok: true, data: result.data.map(mapPrinter) };
}

module.exports = { getPrinters, mapPrinter };
