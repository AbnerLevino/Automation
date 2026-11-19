'use strict';

const { spawn } = require('node:child_process');
const os = require('node:os');

const DEFAULT_TIMEOUT_MS = 10000;

function isWindows() {
  return os.platform() === 'win32';
}

// Lista fechada de consultas conhecidas. Cada comando é fixo, somente leitura (Get-*) e nunca
// é montado a partir de entrada do usuário.
const QUERIES = {
  printers:
    'Get-Printer | Select-Object Name, DriverName, PortName, Shared, Default, PrinterStatus | ConvertTo-Json -Depth 3',
  printerDrivers:
    'Get-PrinterDriver | Select-Object Name, Manufacturer, DriverVersion, PrinterEnvironment | ConvertTo-Json -Depth 3',
  computerInfo:
    'Get-ComputerInfo | Select-Object CsName, OsName, OsVersion, OsArchitecture, CsManufacturer, CsModel, OsTotalVisibleMemorySize, OsLastBootUpTime | ConvertTo-Json -Depth 3',
  networkAdapters:
    'Get-NetAdapter | Where-Object Status -eq "Up" | Select-Object Name, InterfaceDescription, MacAddress, Status | ConvertTo-Json -Depth 3',
  networkConfig:
    'Get-NetIPConfiguration | Select-Object InterfaceAlias, IPv4Address, IPv4DefaultGateway, DNSServer | ConvertTo-Json -Depth 4',
};

function runQuery(command, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  return new Promise((resolve) => {
    if (!isWindows()) {
      resolve({ ok: false, reason: 'PowerShell indisponível neste sistema operacional.' });
      return;
    }

    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill();
      resolve({ ok: false, reason: 'A consulta excedeu o tempo limite.' });
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ ok: false, reason: `Não foi possível executar o PowerShell: ${err.message}` });
    });

    child.on('close', (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);

      if (code !== 0) {
        resolve({ ok: false, reason: stderr.trim() || `PowerShell terminou com código ${code}.` });
        return;
      }

      const trimmed = stdout.trim();
      if (!trimmed) {
        resolve({ ok: true, data: [] });
        return;
      }

      try {
        const parsed = JSON.parse(trimmed);
        resolve({ ok: true, data: Array.isArray(parsed) ? parsed : [parsed] });
      } catch (err) {
        resolve({ ok: false, reason: `Não foi possível interpretar a resposta do PowerShell: ${err.message}` });
      }
    });
  });
}

function run(queryName, options) {
  const command = QUERIES[queryName];
  if (!command) {
    return Promise.resolve({ ok: false, reason: `Consulta desconhecida: ${queryName}` });
  }
  return runQuery(command, options);
}

module.exports = { run, isWindows, QUERIES };
