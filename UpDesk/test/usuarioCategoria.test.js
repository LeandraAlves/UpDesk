const test = require('node:test');
const assert = require('node:assert/strict');
const usuarioDeveTerDepartamento = require('../src/utils/usuarioDeveTerDepartamento');
const validarCamposCategoria = require('../src/utils/validarCamposCategoria');

test('perfil cliente não recebe departamento associado', () => {
  assert.equal(usuarioDeveTerDepartamento('cliente', 'Suporte'), false);
});

test('categoria Cliente não recebe departamento independentemente do perfil', () => {
  assert.equal(usuarioDeveTerDepartamento('tecnico', ' Cliente '), false);
});

test('categoria Gerencia continua dispensando departamento', () => {
  assert.equal(usuarioDeveTerDepartamento('admin', 'GERENCIA'), false);
});

test('outros perfis e categorias podem manter departamento', () => {
  assert.equal(usuarioDeveTerDepartamento('tecnico', 'Suporte'), true);
});

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
