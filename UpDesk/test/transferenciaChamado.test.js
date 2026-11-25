const test = require('node:test');
const assert = require('node:assert/strict');
const Chamado = require('../src/models/Chamado');
const Usuario = require('../src/models/Usuario');
const chamadoController = require('../src/controllers/chamadoController');

function criarContexto() {
  const atualizacoes = [];
  const respostas = {
    statusCode: 200,
    body: null,
    redirectUrl: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    redirect(url) {
      this.redirectUrl = url;
      return this;
    }
  };
  const chamado = {
    id: 42,
    status: 'em_andamento',
    tecnicoId: 10,
    departamentoId: 1,
    async update(campos) {
      atualizacoes.push(campos);
    }
  };
  const req = {
    params: { id: '42' },
    body: { departamentoId: '2', tecnicoId: '30' },
    session: { usuario: { id: 10, perfil: 'tecnico', departamentoId: 1 } }
  };
  return { atualizacoes, respostas, chamado, req };
}

test('transfere chamado com departamento e técnico do destino', async (t) => {
  const originals = {
    findByPk: Chamado.findByPk,
    usuarioFindOne: Usuario.findOne
  };
  t.after(() => {
    Chamado.findByPk = originals.findByPk;
    Usuario.findOne = originals.usuarioFindOne;
  });

  const contexto = criarContexto();
  Chamado.findByPk = async () => contexto.chamado;
  Usuario.findOne = async ({ where }) => (
    where.id === 30 && where.departamentoId === 2 && where.perfil === 'tecnico'
      ? { id: 30 }
      : null
  );

  await chamadoController.transferir(contexto.req, contexto.respostas);

  assert.deepEqual(contexto.atualizacoes, [{
    departamentoId: 2,
    categoriaChamadoId: null,
    tecnicoId: 30,
    status: 'em_andamento'
  }]);
  assert.equal(contexto.respostas.redirectUrl, '/chamados/42');
});

test('rejeita técnico que não pertence ao departamento de destino', async (t) => {
  const originals = {
    findByPk: Chamado.findByPk,
    usuarioFindOne: Usuario.findOne
  };
  t.after(() => {
    Chamado.findByPk = originals.findByPk;
    Usuario.findOne = originals.usuarioFindOne;
  });

  const contexto = criarContexto();
  Chamado.findByPk = async () => contexto.chamado;
  Usuario.findOne = async () => null;

  await chamadoController.transferir(contexto.req, contexto.respostas);

  assert.equal(contexto.respostas.statusCode, 400);
  assert.match(contexto.respostas.body, /não pertence ao departamento informado/);
  assert.deepEqual(contexto.atualizacoes, []);
});

test('mantém a categoria quando a transferência fica no mesmo departamento', async (t) => {
  const originals = {
    findByPk: Chamado.findByPk,
    usuarioFindOne: Usuario.findOne
  };
  t.after(() => {
    Chamado.findByPk = originals.findByPk;
    Usuario.findOne = originals.usuarioFindOne;
  });

  const contexto = criarContexto();
  contexto.req.body.departamentoId = '1';
  contexto.chamado.categoriaChamadoId = 7;
  Chamado.findByPk = async () => contexto.chamado;
  Usuario.findOne = async ({ where }) => (
    where.id === 30 && where.departamentoId === 1 && where.perfil === 'tecnico'
      ? { id: 30 }
      : null
  );

  await chamadoController.transferir(contexto.req, contexto.respostas);

  assert.equal(contexto.atualizacoes[0].categoriaChamadoId, 7);
  assert.equal(contexto.respostas.redirectUrl, '/chamados/42');
});
