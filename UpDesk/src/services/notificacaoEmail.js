const nodemailer = require('nodemailer');
const Usuario = require('../models/Usuario');

const statusLegiveis = {
  aberto: 'Em aberto',
  em_andamento: 'Em andamento',
  aguardando: 'Aguardando',
  fechado: 'Resolvido',
  cancelado: 'Cancelado'
};

let transporte;
let avisoConfiguracaoExibido = false;

function obterConfiguracaoSMTP() {
  const campos = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER
  };
  const ausentes = Object.keys(campos).filter(chave => !campos[chave]);
  const porta = Number(process.env.SMTP_PORT || 587);
  const secure = (process.env.SMTP_SECURE || 'false').toLowerCase();
  if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
    ausentes.push('SMTP_PORT válido');
  }
  if (!['true', 'false'].includes(secure)) {
    ausentes.push('SMTP_SECURE (true ou false)');
  }
  if (ausentes.length) {
    return { erro: ausentes.join(', ') };
  }

  return {
    host: campos.SMTP_HOST,
    port: porta,
    secure: secure === 'true',
    auth: { user: campos.SMTP_USER, pass: campos.SMTP_PASS },
    from: campos.SMTP_FROM
  };
}

function avisarSeSMTPNaoConfigurado() {
  const configuracao = obterConfiguracaoSMTP();
  if (configuracao.erro) {
    if (!avisoConfiguracaoExibido) {
      console.warn(`Notificações por e-mail desativadas. Configure no ambiente: ${configuracao.erro}.`);
      avisoConfiguracaoExibido = true;
    }
    return false;
  }
  avisoConfiguracaoExibido = false;
  return true;
}

function obterTransporte(configuracao) {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: configuracao.host,
      port: configuracao.port,
      secure: configuracao.secure,
      auth: configuracao.auth,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000
    });
  }
  return transporte;
}

function destinatariosDoEvento(tipo, ator, cliente, tecnico) {
  if (tipo === 'aberto') {
    return [cliente];
  }
  if (tipo === 'atribuido') {
    return [cliente, tecnico];
  }
  if (tipo === 'atualizado') {
    return [
      ator && ator.id !== cliente.id ? cliente : null,
      ator && ator.perfil === 'cliente' ? tecnico : null
    ];
  }
  if (tipo === 'mensagem') {
    return [ator && ator.perfil === 'cliente' ? tecnico : cliente];
  }
  if (tipo === 'status') {
    return [ator && ator.perfil === 'cliente' ? tecnico : cliente];
  }
  throw new Error(`Tipo de notificação de chamado desconhecido: ${tipo}`);
}

const mensagensEvento = {
  aberto: 'Seu chamado foi registrado.',
  atribuido: 'O responsável pelo chamado foi atribuído ou atualizado.',
  atualizado: 'Os dados do chamado foram atualizados.',
  mensagem: 'Uma nova mensagem foi adicionada ao chamado.',
  status: 'O status do chamado foi atualizado.'
};

async function notificarChamado(req, chamado, tipo) {
  const configuracao = obterConfiguracaoSMTP();
  if (configuracao.erro) {
    avisarSeSMTPNaoConfigurado();
    return;
  }

  try {
    const [cliente, tecnico] = await Promise.all([
      Usuario.findByPk(chamado.usuarioId, { attributes: ['id', 'nome', 'email'] }),
      chamado.tecnicoId
        ? Usuario.findByPk(chamado.tecnicoId, { attributes: ['id', 'nome', 'email'] })
        : null
    ]);
    if (!cliente) {
      throw new Error(`Solicitante do chamado ${chamado.id} não foi encontrado.`);
    }

    const ator = req.session && req.session.usuario;
    const destinatarios = destinatariosDoEvento(tipo, ator, cliente, tecnico)
      .filter(usuario => usuario && usuario.email);
    const unicos = Array.from(new Map(destinatarios.map(usuario => [usuario.email, usuario])).values());
    if (!unicos.length) {
      return;
    }

    const baseUrl = (process.env.APP_URL || 'https://updesk-nru0.onrender.com').replace(/\/+$/, '');
    const url = `${baseUrl}/chamados/${chamado.id}`;
    const status = statusLegiveis[chamado.status] || chamado.status;
    const transporteSMTP = obterTransporte(configuracao);

    await Promise.all(unicos.map(async (destinatario) => {
      const texto = [
        `Olá, ${destinatario.nome}.`,
        '',
        mensagensEvento[tipo],
        '',
        `Chamado: #${chamado.id} — ${chamado.titulo}`,
        `Status: ${status}`,
        `Prioridade: ${chamado.prioridade}`,
        '',
        `Acesse o chamado: ${url}`
      ].join('\n');

      try {
        await transporteSMTP.sendMail({
          from: configuracao.from,
          to: destinatario.email,
          subject: `[UpDesk] Chamado #${chamado.id}: ${mensagensEvento[tipo]}`,
          text: texto
        });
      } catch (erro) {
        console.error('Falha ao enviar notificação por e-mail:', erro);
      }
    }));
  } catch (erro) {
    console.error('Falha ao preparar notificação por e-mail:', erro);
  }
}

module.exports = { avisarSeSMTPNaoConfigurado, notificarChamado };
