const test = require('node:test');
const assert = require('node:assert/strict');
const Usuario = require('../src/models/Usuario');
const Departamento = require('../src/models/Departamento');
const RegistroAuditoria = require('../src/models/RegistroAuditoria');
const usuarioController = require('../src/controllers/usuarioController');

function criarContexto() {
  const atualizacoes = [];
  const resposta = {
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
  const usuario = {
    id: 8,
    nome: 'Cliente',
    email: 'cliente@example.com',
    perfil: 'cliente',
    departamentoId: null,
    async update(campos) {
      atualizacoes.push(campos);
    }
  };
  const req = {
    params: { id: '8' },
    body: {
      nome: 'Técnico',
      email: 'tecnico@example.com',
      perfil: 'tecnico',
      departamentoId: '3',
      senha: ''
    },
    session: { usuario: { id: 1, nome: 'Administrador', perfil: 'admin' } }
  };
  return { atualizacoes, resposta, usuario, req };
}

test('edita o perfil e departamento sem alterar a senha quando o campo fica vazio', async (t) => {
  const originais = {
    findByPk: Usuario.findByPk,
    count: Usuario.count,
    departamentoFindByPk: Departamento.findByPk,
    registroCreate: RegistroAuditoria.create
  };
  t.after(() => {
    Usuario.findByPk = originais.findByPk;
    Usuario.count = originais.count;
    Departamento.findByPk = originais.departamentoFindByPk;
    RegistroAuditoria.create = originais.registroCreate;
  });

  const contexto = criarContexto();
  Usuario.findByPk = async () => contexto.usuario;
  Departamento.findByPk = async id => (id === 3 ? { id } : null);
  RegistroAuditoria.create = async () => ({});

  await usuarioController.editar(contexto.req, contexto.resposta);

  assert.deepEqual(contexto.atualizacoes, [{
    nome: 'Técnico',
    email: 'tecnico@example.com',
    perfil: 'tecnico',
    departamentoId: 3
  }]);
  assert.equal(contexto.resposta.redirectUrl, '/usuarios?sucesso=editado');
});

test('impede remover o último administrador', async (t) => {
  const originais = {
    findByPk: Usuario.findByPk,
    count: Usuario.count,
    registroCreate: RegistroAuditoria.create
  };
  t.after(() => {
    Usuario.findByPk = originais.findByPk;
    Usuario.count = originais.count;
    RegistroAuditoria.create = originais.registroCreate;
  });

  const contexto = criarContexto();
  contexto.usuario.perfil = 'admin';
  contexto.req.body.perfil = 'cliente';
  Usuario.findByPk = async () => contexto.usuario;
  Usuario.count = async () => 1;

  await usuarioController.editar(contexto.req, contexto.resposta);

  assert.equal(contexto.resposta.statusCode, 409);
  assert.match(contexto.resposta.body, /pelo menos um administrador/);
  assert.deepEqual(contexto.atualizacoes, []);
});
