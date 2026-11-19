'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const chatEl = document.getElementById('chat');
  const scrollEl = document.getElementById('scroll');
  const boardEl = document.getElementById('board');
  const engine = new window.ChatEngine(chatEl, scrollEl, boardEl);

  engine.addBubble(true, 'Olá! Selecione uma consulta abaixo.');

  const buttons = [...document.querySelectorAll('footer button')];
  const actions = {
    'btn-printers': window.modules.runPrinters,
    'btn-drivers': window.modules.runDrivers,
    'btn-computer': window.modules.runComputer,
    'btn-network': window.modules.runNetwork,
    'btn-summary': window.modules.runSummary,
    'btn-export': window.modules.runExport,
  };

  Object.entries(actions).forEach(([id, handler]) => {
    const button = document.getElementById(id);
    button.addEventListener('click', async () => {
      buttons.forEach((b) => (b.disabled = true));
      try {
        await handler(engine);
      } finally {
        buttons.forEach((b) => (b.disabled = false));
      }
    });
  });
});
