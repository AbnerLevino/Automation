'use strict';

function naText(value) {
  return value === null || value === undefined || value === '' ? 'não disponível' : String(value);
}

function printerLines(printers) {
  return printers.map((p) => {
    const flags = [p.isDefault ? 'padrão' : null, p.isShared ? 'compartilhada' : null]
      .filter(Boolean)
      .join(', ');
    return `${naText(p.name)} — status: ${naText(p.status)} — porta: ${naText(p.port)}${flags ? ` (${flags})` : ''}`;
  });
}

function driverLines(drivers) {
  return drivers.map(
    (d) => `${naText(d.name)} — fabricante: ${naText(d.manufacturer)} — versão: ${naText(d.version)}`
  );
}

function computerLines(info) {
  if (!info) return ['Não disponível.'];
  return [
    `Nome: ${naText(info.name)}`,
    `Sistema: ${naText(info.osName)} (${naText(info.osVersion)}, ${naText(info.architecture)})`,
    `Fabricante/modelo: ${naText(info.manufacturer)} ${naText(info.model)}`,
    `RAM: ${info.ramGB !== null && info.ramGB !== undefined ? `${info.ramGB} GB` : 'não disponível'}`,
    `Tempo ativo: ${naText(info.uptime)}`,
  ];
}

function networkLines(network) {
  const adapterLines = network.adapters.data.map(
    (a) => `${naText(a.name)} — ${naText(a.mac)} — ${naText(a.status)}`
  );
  const configLines = network.config.data.map(
    (c) =>
      `${naText(c.interfaceAlias)} — IPv4: ${naText(c.ipv4)} — gateway: ${naText(c.gateway)} — DNS: ${
        c.dns.length ? c.dns.join(', ') : 'não disponível'
      }`
  );
  return [...adapterLines, ...configLines];
}

module.exports = { naText, printerLines, driverLines, computerLines, networkLines };
