const test = require('node:test');
const assert = require('node:assert/strict');
const {
  autenticado,
  administrador,
  somenteAdministrador,
  tecnicoOuAdministrador
} = require('../src/middlewares/autenticacao');

function criarResposta() {
  return {
    codigo: 200,
    mensagem: '',
    destino: '',
    status(codigo) {
      this.codigo = codigo;
      return this;
    },
    send(mensagem) {
      this.mensagem = mensagem;
      return this;
    },
    redirect(destino) {
      this.destino = destino;
      return this;
    }
  };
}

test('redireciona sessões ausentes para o login', () => {
  const resposta = criarResposta();
  let continuou = false;

  autenticado({ session: null }, resposta, () => { continuou = true; });

  assert.equal(resposta.destino, '/autenticacao/login');
  assert.equal(continuou, false);
});

test('permite continuar com sessão autenticada', () => {
  const resposta = criarResposta();
  let continuou = false;

  autenticado({ session: { usuario: { id: 1 } } }, resposta, () => { continuou = true; });

  assert.equal(continuou, true);
});

test('nega acesso administrativo sem usuário na sessão', () => {
  const resposta = criarResposta();
  let continuou = false;

  administrador({ session: {} }, resposta, () => { continuou = true; });

  assert.equal(resposta.codigo, 403);
  assert.equal(continuou, false);
});

test('nega acesso administrativo ao perfil cliente', () => {
  const resposta = criarResposta();

  administrador({ session: { usuario: { perfil: 'cliente' } } }, resposta, () => {});

  assert.equal(resposta.codigo, 403);
});

test('permite acesso administrativo aos perfis autorizados', () => {
  for (const perfil of ['admin', 'gerencia']) {
    let continuou = false;
    administrador({ session: { usuario: { perfil } } }, criarResposta(), () => { continuou = true; });
    assert.equal(continuou, true);
  }
});

test('somente o perfil admin pode gerenciar tipos e categorias', () => {
  const resposta = criarResposta();
  let continuou = false;

  somenteAdministrador({ session: { usuario: { perfil: 'gerencia' } } }, resposta, () => {
    continuou = true;
  });

  assert.equal(resposta.codigo, 403);
  assert.equal(continuou, false);
});

test('nega acesso de atendimento ao perfil cliente', () => {
  const resposta = criarResposta();

  tecnicoOuAdministrador({ session: { usuario: { perfil: 'cliente' } } }, resposta, () => {});

  assert.equal(resposta.codigo, 403);
});

test('permite acesso de atendimento a técnicos e administradores', () => {
  for (const perfil of ['tecnico', 'admin']) {
    let continuou = false;
    tecnicoOuAdministrador({ session: { usuario: { perfil } } }, criarResposta(), () => { continuou = true; });
    assert.equal(continuou, true);
  }
});
