'use strict';

// Roteiro de cada módulo: aqui sim conhecemos impressora/driver/computador/rede. O motor
// (engine.js) não sabe nada disso — só recebe texto e linhas prontas.

async function fetchJson(path) {
  const response = await fetch(path);
  return response.json();
}

async function runPrinters(engine) {
  engine.addUserChoice('Impressoras');
  await engine.say('Vou consultar as impressoras instaladas...');
  const result = await fetchJson('/api/printers');
  if (!result.ok) {
    await engine.say(`Não consegui consultar: ${result.reason}`);
    engine.hideBoard();
    return;
  }
  if (result.data.length === 0) {
    await engine.say('Nenhuma impressora foi encontrada.');
    engine.hideBoard();
    return;
  }
  await engine.say(`Encontrei ${result.data.length} impressora(s). Veja os detalhes abaixo.`);
  engine.showBoard('Impressoras encontradas', result.lines);
}

async function runDrivers(engine) {
  engine.addUserChoice('Drivers');
  await engine.say('Vou consultar os drivers de impressão instalados...');
  const result = await fetchJson('/api/drivers');
  if (!result.ok) {
    await engine.say(`Não consegui consultar: ${result.reason}`);
    engine.hideBoard();
    return;
  }
  if (result.data.length === 0) {
    await engine.say('Nenhum driver de impressão foi encontrado.');
    engine.hideBoard();
    return;
  }
  await engine.say(`Encontrei ${result.data.length} driver(s). Veja os detalhes abaixo.`);
  engine.showBoard('Drivers encontrados', result.lines);
}

async function runComputer(engine) {
  engine.addUserChoice('Computador');
  await engine.say('Vou consultar as informações do computador...');
  const result = await fetchJson('/api/computer');
  if (!result.ok) {
    await engine.say(`Não consegui consultar: ${result.reason}`);
    engine.hideBoard();
    return;
  }
  await engine.say('Aqui estão as informações que encontrei.');
  engine.showBoard('Informações do computador', result.lines);
}

async function runNetwork(engine) {
  engine.addUserChoice('Rede');
  await engine.say('Vou consultar os adaptadores e a configuração de rede...');
  const result = await fetchJson('/api/network');
  if (!result.lines || result.lines.length === 0) {
    await engine.say('Nenhuma informação de rede foi encontrada.');
    engine.hideBoard();
    return;
  }
  await engine.say('Aqui está o que encontrei sobre a rede.');
  engine.showBoard('Informações de rede', result.lines);
}

async function runSummary(engine) {
  engine.addUserChoice('Visão geral');
  await engine.say('Vou consultar impressoras, drivers, computador e rede...');
  const result = await fetchJson('/api/summary');
  const lines = [
    '— Impressoras —',
    ...(result.printers.lines.length ? result.printers.lines : ['Não disponível.']),
    '— Drivers —',
    ...(result.drivers.lines.length ? result.drivers.lines : ['Não disponível.']),
    '— Computador —',
    ...result.computer.lines,
    '— Rede —',
    ...(result.network.lines.length ? result.network.lines : ['Não disponível.']),
  ];
  await engine.say('Consulta geral concluída. Veja o resumo abaixo.');
  engine.showBoard('Resumo geral', lines);
}

async function runExport(engine) {
  engine.addUserChoice('Exportar JSON');
  await engine.say('Vou gerar um arquivo JSON com a última consulta geral...');
  const result = await fetchJson('/api/export');
  if (!result.ok) {
    await engine.say(`Não consegui exportar: ${result.reason}`);
    return;
  }
  await engine.say(`Arquivo gerado: reports/${result.file}`);
}

window.modules = { runPrinters, runDrivers, runComputer, runNetwork, runSummary, runExport };
