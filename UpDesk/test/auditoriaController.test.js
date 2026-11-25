const test = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');
const RegistroAuditoria = require('../src/models/RegistroAuditoria');
const auditoriaController = require('../src/controllers/auditoriaController');

function criarContexto(perfil, id, query = {}) {
  const resposta = {
    statusCode: 200,
    body: null,
    view: null,
    dados: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    render(view, dados) {
      this.view = view;
      this.dados = dados;
      return this;
    }
  };
  return {
    req: { session: { usuario: { id, perfil } }, query },
    resposta
  };
}

test('técnicos consultam somente transferências recebidas por eles', async (t) => {
  const originais = {
    count: RegistroAuditoria.count,
    findAll: RegistroAuditoria.findAll
  };
  t.after(() => {
    RegistroAuditoria.count = originais.count;
    RegistroAuditoria.findAll = originais.findAll;
  });

  const filtros = [];
  RegistroAuditoria.count = async ({ where }) => {
    filtros.push(where);
    return 0;
  };
  RegistroAuditoria.findAll = async ({ where }) => {
    filtros.push(where);
    return [];
  };
  const contexto = criarContexto('tecnico', 17);

  await auditoriaController.listar(contexto.req, contexto.resposta);

  assert.deepEqual(filtros, [
    { acao: 'chamado_transferido', transferidoParaId: 17 },
    { acao: 'chamado_transferido', transferidoParaId: 17 }
  ]);
  assert.equal(contexto.resposta.view, 'auditoria/index');
});

test('administradores consultam apenas chamados assumidos, transferidos ou finalizados', async (t) => {
  const originais = {
    count: RegistroAuditoria.count,
    findAll: RegistroAuditoria.findAll
  };
  t.after(() => {
    RegistroAuditoria.count = originais.count;
    RegistroAuditoria.findAll = originais.findAll;
  });

  let filtroLista;
  const filtroAcompanhamento = {
    acao: {
      [Op.in]: ['chamado_atribuido', 'chamado_transferido', 'chamado_resolvido']
    }
  };
  RegistroAuditoria.count = async ({ where }) => {
    assert.deepEqual(where, filtroAcompanhamento);
    return 0;
  };
  RegistroAuditoria.findAll = async ({ where }) => {
    filtroLista = where;
    return [];
  };
  const contexto = criarContexto('admin', 1);

  await auditoriaController.listar(contexto.req, contexto.resposta);

  assert.deepEqual(filtroLista, filtroAcompanhamento);
  assert.equal(contexto.resposta.view, 'auditoria/index');
});
