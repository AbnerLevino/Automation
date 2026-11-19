'use strict';

const { spawn } = require('node:child_process');
const os = require('node:os');
const fs = require('node:fs');
const { createServer } = require('./server');

const PORT = 4321;

function findEdgePath() {
  const candidates = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? 'msedge.exe';
}

function openWindow(url) {
  if (os.platform() !== 'win32') {
    console.log(`Servidor rodando em ${url} (abra manualmente — a janela em modo app só é aberta no Windows).`);
    return;
  }
  const edgePath = findEdgePath();
  spawn(edgePath, [`--app=${url}`, '--window-size=560,720'], { detached: true, stdio: 'ignore' }).unref();
}

const server = createServer();
server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`Equipment Inspector rodando em ${url}`);
  openWindow(url);
});
