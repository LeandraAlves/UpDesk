const test = require('node:test');
const assert = require('node:assert/strict');
const validarCamposCategoria = require('../src/utils/validarCamposCategoria');

test('exige o nome da categoria', () => {
  assert.equal(
    validarCamposCategoria('', ''),
    'O nome da categoria é obrigatório.'
  );
});

test('aceita campos de categoria dentro do limite', () => {
  assert.equal(validarCamposCategoria('A'.repeat(255), 'B'.repeat(255)), null);
});

test('rejeita nome de categoria acima de 255 caracteres', () => {
  assert.equal(
    validarCamposCategoria('A'.repeat(256), ''),
    'O nome da categoria deve ter no máximo 255 caracteres.'
  );
});

test('rejeita descrição de categoria acima de 255 caracteres', () => {
  assert.equal(
    validarCamposCategoria('Cliente', 'A'.repeat(256)),
    'A descrição da categoria deve ter no máximo 255 caracteres.'
  );
});
