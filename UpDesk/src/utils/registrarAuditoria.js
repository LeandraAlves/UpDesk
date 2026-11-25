const RegistroAuditoria = require('../models/RegistroAuditoria');

async function registrarAuditoria(req, evento, transaction) {
  const ator = evento.ator || (req.session && req.session.usuario);
  if (!ator) {
    throw new Error('Não é possível registrar auditoria sem usuário autenticado.');
  }

  return RegistroAuditoria.create({
    atorId: ator.id,
    atorNome: ator.nome,
    atorPerfil: ator.perfil,
    acao: evento.acao,
    entidade: evento.entidade,
    entidadeId: evento.entidadeId === undefined ? null : String(evento.entidadeId),
    transferidoParaId: evento.transferidoParaId || null,
    detalhes: evento.detalhes || {}
  }, transaction ? { transaction } : undefined);
}

module.exports = registrarAuditoria;
