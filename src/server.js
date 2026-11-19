'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const printers = require('./modules/printers');
const drivers = require('./modules/drivers');
const computer = require('./modules/computer');
const network = require('./modules/network');
const formatter = require('./utils/formatter');

const UI_DIR = path.join(__dirname, 'ui');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const requestedPath = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(UI_DIR, safePath);

  if (!filePath.startsWith(UI_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Não encontrado');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
    res.end(data);
  });
}

async function handleApi(req, res, route) {
  try {
    if (route === 'printers') {
      const result = await printers.getPrinters();
      sendJson(res, 200, { ...result, lines: result.ok ? formatter.printerLines(result.data) : [] });
      return;
    }
    if (route === 'drivers') {
      const result = await drivers.getDrivers();
      sendJson(res, 200, { ...result, lines: result.ok ? formatter.driverLines(result.data) : [] });
      return;
    }
    if (route === 'computer') {
      const result = await computer.getComputerInfo();
      sendJson(res, 200, { ...result, lines: formatter.computerLines(result.data) });
      return;
    }
    if (route === 'network') {
      const result = await network.getNetwork();
      sendJson(res, 200, {
        ok: result.adapters.ok && result.config.ok,
        data: result,
        lines: formatter.networkLines(result),
      });
      return;
    }
    if (route === 'summary') {
      const [p, d, c, n] = await Promise.all([
        printers.getPrinters(),
        drivers.getDrivers(),
        computer.getComputerInfo(),
        network.getNetwork(),
      ]);
      sendJson(res, 200, {
        printers: { ...p, lines: p.ok ? formatter.printerLines(p.data) : [] },
        drivers: { ...d, lines: d.ok ? formatter.driverLines(d.data) : [] },
        computer: { ...c, lines: formatter.computerLines(c.data) },
        network: { ok: n.adapters.ok && n.config.ok, data: n, lines: formatter.networkLines(n) },
      });
      return;
    }
    if (route === 'export') {
      const [p, d, c, n] = await Promise.all([
        printers.getPrinters(),
        drivers.getDrivers(),
        computer.getComputerInfo(),
        network.getNetwork(),
      ]);
      const report = {
        generatedAt: new Date().toISOString(),
        printers: p,
        drivers: d,
        computer: c,
        network: n,
      };
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
      const fileName = `relatorio-${Date.now()}.json`;
      fs.writeFileSync(path.join(REPORTS_DIR, fileName), JSON.stringify(report, null, 2));
      sendJson(res, 200, { ok: true, file: fileName });
      return;
    }
    sendJson(res, 404, { ok: false, reason: 'Rota desconhecida.' });
  } catch (err) {
    sendJson(res, 500, { ok: false, reason: err.message });
  }
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      handleApi(req, res, url.pathname.replace('/api/', ''));
      return;
    }
    serveStatic(req, res);
  });
}

module.exports = { createServer };
