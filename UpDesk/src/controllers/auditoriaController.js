const { Op } = require('sequelize');
const RegistroAuditoria = require('../models/RegistroAuditoria');

const acoesAcompanhamento = [
  'chamado_atribuido',
  'chamado_transferido',
  'chamado_resolvido'
];

exports.listar = async (req, res) => {
  const usuario = req.session.usuario;
  if (!['admin', 'gerencia', 'tecnico'].includes(usuario.perfil)) {
    return res.status(403).send('Acesso permitido somente para administradores e técnicos.');
  }
  const pagina = typeof req.query.pagina === 'string' ? req.query.pagina : '1';
  if (!/^[1-9]\d*$/.test(pagina)) {
    return res.status(400).send('Número de página inválido.');
  }

  try {
    const where = usuario.perfil === 'tecnico'
      ? { acao: 'chamado_transferido', transferidoParaId: usuario.id }
      : { acao: { [Op.in]: acoesAcompanhamento } };
    const tamanhoPagina = 50;
    const total = await RegistroAuditoria.count({ where });
    const paginas = Math.max(1, Math.ceil(total / tamanhoPagina));
    const paginaAtual = Math.min(Number(pagina), paginas);
    const registros = await RegistroAuditoria.findAll({
      where,
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit: tamanhoPagina,
      offset: (paginaAtual - 1) * tamanhoPagina
    });
    return res.render('auditoria/index', {
      usuario,
      registros,
      pagina: paginaAtual,
      paginas,
      total,
      acoesAcompanhamento: {
        chamado_atribuido: 'Pegou o chamado',
        chamado_transferido: 'Transferiu o chamado',
        chamado_resolvido: 'Finalizou o chamado'
      }
    });
  } catch (erro) {
    console.error('Erro ao carregar registros de auditoria:', erro);
    return res.status(500).send('Não foi possível carregar os registros de auditoria.');
  }
};
