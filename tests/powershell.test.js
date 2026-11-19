'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const powershell = require('../src/services/powershell');

test('run() rejects unknown query names without touching the system', async () => {
  const result = await powershell.run('not-a-real-query');
  assert.equal(result.ok, false);
});

test('run() reports PowerShell as unavailable on non-Windows platforms', async (t) => {
  if (powershell.isWindows()) {
    t.skip('Este teste só é determinístico fora do Windows.');
    return;
  }
  const result = await powershell.run('printers');
  assert.equal(result.ok, false);
  assert.match(result.reason, /indisponível/);
});

test('every known query is read-only (Get-* only, no write verbs)', () => {
  const forbidden = /\b(Set|Remove|New|Restart|Install|Stop|Start|Clear|Add|Update)-/i;
  for (const [name, command] of Object.entries(powershell.QUERIES)) {
    assert.doesNotMatch(command, forbidden, `consulta "${name}" parece conter um verbo de escrita`);
  }
});
