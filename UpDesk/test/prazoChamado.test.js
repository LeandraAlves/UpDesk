const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularPrazo } = require('../src/utils/prazoChamado');

test('calcula o prazo de prioridade alta no próximo dia útil', () => {
  const prazo = calcularPrazo('alta', new Date(2026, 10, 16, 12));
  assert.equal(prazo.getDate(), 17);
  assert.equal(prazo.getHours(), 23);
});

test('ignora sábado e domingo ao calcular dias úteis', () => {
  const prazo = calcularPrazo('alta', new Date(2026, 10, 20, 12));
  assert.equal(prazo.getDay(), 1);
  assert.equal(prazo.getDate(), 23);
});

test('calcula prazos de prioridade média e baixa', () => {
  const inicio = new Date(2026, 10, 16, 12);
  assert.equal(calcularPrazo('media', inicio).getDate(), 19);
  assert.equal(calcularPrazo('baixa', inicio).getDate(), 23);
});

test('rejeita prioridade sem regra de prazo', () => {
  assert.throws(() => calcularPrazo('urgente', new Date()), /Prioridade inválida/);
});
