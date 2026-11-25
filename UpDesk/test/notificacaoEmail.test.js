const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const Usuario = require('../src/models/Usuario');

test('notifica somente o cliente e o técnico atribuído conforme o evento', async (t) => {
  const chavesAmbiente = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM',
    'APP_URL'
  ];
  const ambienteOriginal = Object.fromEntries(chavesAmbiente.map(chave => [chave, process.env[chave]]));
  const criarTransporteOriginal = nodemailer.createTransport;
  const buscarUsuarioOriginal = Usuario.findByPk;
  const mensagens = [];
  process.env.SMTP_HOST = 'smtp.example.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_USER = 'updesk@example.com';
  process.env.SMTP_PASS = 'test-password';
  process.env.SMTP_FROM = 'UpDesk <updesk@example.com>';
  process.env.APP_URL = 'https://updesk.example.com';
  nodemailer.createTransport = () => ({
    async sendMail(mensagem) {
      mensagens.push(mensagem);
    }
  });
  Usuario.findByPk = async id => ({
    id: Number(id),
    nome: Number(id) === 1 ? 'Cliente' : 'Técnico',
    email: Number(id) === 1 ? 'cliente@example.com' : 'tecnico@example.com'
  });
  t.after(() => {
    nodemailer.createTransport = criarTransporteOriginal;
    Usuario.findByPk = buscarUsuarioOriginal;
    chavesAmbiente.forEach(chave => {
      if (ambienteOriginal[chave] === undefined) {
        delete process.env[chave];
      } else {
        process.env[chave] = ambienteOriginal[chave];
      }
    });
  });

  const { notificarChamado } = require('../src/services/notificacaoEmail');
  const chamado = {
    id: 52,
    usuarioId: 1,
    tecnicoId: 2,
    titulo: 'Acesso indisponível',
    status: 'em_andamento',
    prioridade: 'alta'
  };

  await notificarChamado(
    { session: { usuario: { id: 1, perfil: 'cliente' } } },
    chamado,
    'aberto'
  );
  assert.deepEqual(mensagens.map(mensagem => mensagem.to), ['cliente@example.com']);

  mensagens.length = 0;
  await notificarChamado(
    { session: { usuario: { id: 3, perfil: 'admin' } } },
    chamado,
    'atribuido'
  );
  assert.deepEqual(
    mensagens.map(mensagem => mensagem.to).sort(),
    ['cliente@example.com', 'tecnico@example.com']
  );

  mensagens.length = 0;
  await notificarChamado(
    { session: { usuario: { id: 1, perfil: 'cliente' } } },
    chamado,
    'mensagem'
  );
  assert.deepEqual(mensagens.map(mensagem => mensagem.to), ['tecnico@example.com']);

  mensagens.length = 0;
  await notificarChamado(
    { session: { usuario: { id: 2, perfil: 'tecnico' } } },
    chamado,
    'mensagem'
  );
  assert.deepEqual(mensagens.map(mensagem => mensagem.to), ['cliente@example.com']);
  assert.match(mensagens[0].text, /https:\/\/updesk\.example\.com\/chamados\/52/);

  mensagens.length = 0;
  await notificarChamado(
    { session: { usuario: { id: 1, perfil: 'cliente' } } },
    chamado,
    'atualizado'
  );
  assert.deepEqual(mensagens.map(mensagem => mensagem.to), ['tecnico@example.com']);

  mensagens.length = 0;
  await notificarChamado(
    { session: { usuario: { id: 2, perfil: 'tecnico' } } },
    chamado,
    'status'
  );
  assert.deepEqual(mensagens.map(mensagem => mensagem.to), ['cliente@example.com']);
});
