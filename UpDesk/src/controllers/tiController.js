const { Op } = require('sequelize');
const Chamado = require('../models/Chamado');
const Usuario = require('../models/Usuario');
const CategoriaChamado = require('../models/CategoriaChamado');
const Departamento = require('../models/Departamento');
const MensagemEquipe = require('../models/MensagemEquipe');
const registrarAuditoria = require('../utils/registrarAuditoria');

const ehAdmin = (usuario) => ['admin', 'gerencia'].includes(usuario.perfil);

exports.painelTi = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const where = ehAdmin(usuario) ? {} : { tecnicoId: usuario.id };
    const [total, pendentes, resolvidos, chamadosRecentes] = await Promise.all([
      Chamado.count({ where }),
      Chamado.count({ where: { ...where, status: { [Op.notIn]: ['fechado', 'cancelado'] } } }),
      Chamado.count({ where: { ...where, status: 'fechado' } }),
      Chamado.findAll({
        where,
        include: [
          { model: Usuario, as: 'solicitante', attributes: ['nome'] },
          { model: CategoriaChamado, as: 'categoria', attributes: ['nome'] },
          { model: Departamento, as: 'departamento', attributes: ['nome'] }
        ],
        order: [['updatedAt', 'DESC']],
        limit: 5
      })
    ]);
    return res.render('inicioTi', {
      usuario,
      total,
      pendentes,
      resolvidos,
      chamadosRecentes
    });
  } catch (erro) {
    console.error('Erro ao carregar painel técnico:', erro);
    return res.status(500).send('Não foi possível carregar o painel técnico.');
  }
};

exports.listarChamadosAbertos = async (req, res) => {
  const usuario = req.session.usuario;
  const filtros = {
    busca: typeof req.query.busca === 'string' ? req.query.busca.trim() : '',
    prioridade: typeof req.query.prioridade === 'string' ? req.query.prioridade : '',
    categoriaId: typeof req.query.categoriaId === 'string' ? req.query.categoriaId : '',
    departamentoId: typeof req.query.departamentoId === 'string' ? req.query.departamentoId : ''
  };
  if (filtros.busca.length > 100) {
    return res.status(400).send('A pesquisa deve ter no máximo 100 caracteres.');
  }
  if (filtros.prioridade && !['baixa', 'media', 'alta'].includes(filtros.prioridade)) {
    return res.status(400).send('Prioridade inválida.');
  }
  if ((filtros.categoriaId && !/^[1-9]\d*$/.test(filtros.categoriaId)) ||
      (filtros.departamentoId && !/^[1-9]\d*$/.test(filtros.departamentoId))) {
    return res.status(400).send('Categoria ou departamento inválido.');
  }
  try {
    const where = { status: 'aberto', tecnicoId: null };
    if (!ehAdmin(usuario)) {
      where.departamentoId = usuario.departamentoId || 0;
    } else if (/^[1-9]\d*$/.test(filtros.departamentoId)) {
      where.departamentoId = Number(filtros.departamentoId);
    }
    if (filtros.prioridade) where.prioridade = filtros.prioridade;
    if (/^[1-9]\d*$/.test(filtros.categoriaId)) {
      where.categoriaChamadoId = Number(filtros.categoriaId);
    }
    if (filtros.busca) {
      where[Op.or] = [
        { titulo: { [Op.like]: `%${filtros.busca}%` } },
        { descricao: { [Op.like]: `%${filtros.busca}%` } }
      ];
      if (/^\d+$/.test(filtros.busca)) where[Op.or].push({ id: Number(filtros.busca) });
    }
    const [chamadosAbertos, categorias, departamentos] = await Promise.all([
      Chamado.findAll({
        where,
        include: [
          { model: Usuario, as: 'solicitante', attributes: ['id', 'nome'] },
          { model: CategoriaChamado, as: 'categoria', attributes: ['id', 'nome'] },
          { model: Departamento, as: 'departamento', attributes: ['id', 'nome'] }
        ],
        order: [['createdAt', 'DESC']]
      }),
      CategoriaChamado.findAll({ order: [['nome', 'ASC']] }),
      ehAdmin(usuario) ? Departamento.findAll({ order: [['nome', 'ASC']] }) : []
    ]);
    return res.render('filaTi', {
      usuario,
      chamadosAbertos,
      categorias,
      departamentos,
      filtros
    });
  } catch (erro) {
    console.error('Erro ao carregar fila de atendimento:', erro);
    return res.status(500).send('Não foi possível carregar a fila de atendimento.');
  }
};

exports.desempenho = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (usuario.perfil !== 'admin') {
      return res.status(403).send('Acesso permitido somente para administradores.');
    }
    const tecnicoId = typeof req.query.tecnicoId === 'string' ? req.query.tecnicoId : '';
    const where = {};
    if (tecnicoId) {
      if (!/^[1-9]\d*$/.test(tecnicoId)) {
        return res.status(400).send('Técnico inválido.');
      }
      const tecnico = await Usuario.findOne({
        where: { id: Number(tecnicoId), perfil: 'tecnico' },
        attributes: ['id']
      });
      if (!tecnico) return res.status(400).send('Técnico inválido.');
      where.tecnicoId = tecnico.id;
    }
    const [pendentes, resolvidos, tecnicos] = await Promise.all([
      Chamado.count({ where: { ...where, status: { [Op.notIn]: ['fechado', 'cancelado'] } } }),
      Chamado.count({ where: { ...where, status: 'fechado' } }),
      Usuario.findAll({
        where: { perfil: 'tecnico' },
        attributes: ['id', 'nome'],
        order: [['nome', 'ASC']]
      })
    ]);
    return res.render('desempenho', { usuario, pendentes, resolvidos, tecnicos, tecnicoId });
  } catch (erro) {
    console.error('Erro ao carregar desempenho:', erro);
    return res.status(500).send('Não foi possível carregar o desempenho.');
  }
};

exports.equipe = async (req, res) => {
  const usuario = req.session.usuario;
  if (usuario.perfil !== 'tecnico') {
    return res.status(403).send('Acesso permitido somente para técnicos.');
  }
  try {
    const tecnicos = usuario.departamentoId
      ? await Usuario.findAll({
        where: {
          perfil: 'tecnico',
          departamentoId: usuario.departamentoId,
          id: { [Op.ne]: usuario.id }
        },
        attributes: ['id', 'nome'],
        order: [['nome', 'ASC']]
      })
      : [];
    let tecnicoSelecionado = null;
    if (req.query.tecnicoId !== undefined) {
      if (!/^[1-9]\d*$/.test(String(req.query.tecnicoId))) {
        return res.status(400).send('Técnico inválido.');
      }
      tecnicoSelecionado = tecnicos.find(tecnico => tecnico.id === Number(req.query.tecnicoId));
      if (!tecnicoSelecionado) {
        return res.status(404).send('O técnico não pertence à sua equipe.');
      }
    } else if (tecnicos.length) {
      tecnicoSelecionado = tecnicos[0];
    }
    return res.render('equipe', { usuario, tecnicos, tecnicoSelecionado });
  } catch (erro) {
    console.error('Erro ao carregar equipe técnica:', erro);
    return res.status(500).send('Não foi possível carregar a equipe.');
  }
};

async function validarColegaEquipe(usuario, tecnicoId) {
  if (usuario.perfil !== 'tecnico' || !usuario.departamentoId) {
    return { erro: { status: 403, mensagem: 'Acesso permitido somente a técnicos da equipe.' } };
  }
  if (!/^[1-9]\d*$/.test(String(tecnicoId)) || Number(tecnicoId) === usuario.id) {
    return { erro: { status: 400, mensagem: 'Técnico inválido.' } };
  }
  const tecnico = await Usuario.findOne({
    where: {
      id: Number(tecnicoId),
      perfil: 'tecnico',
      departamentoId: usuario.departamentoId
    },
    attributes: ['id', 'nome']
  });
  if (!tecnico) {
    return { erro: { status: 404, mensagem: 'O técnico não pertence à sua equipe.' } };
  }
  return { tecnico };
}

exports.listarMensagensEquipe = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const resultado = await validarColegaEquipe(usuario, req.params.tecnicoId);
    if (resultado.erro) {
      return res.status(resultado.erro.status).json({ erro: resultado.erro.mensagem });
    }
    const after = req.query.after;
    if (after !== undefined && !/^[1-9]\d*$/.test(String(after))) {
      return res.status(400).json({ erro: 'Identificador de mensagem inválido.' });
    }
    const condicoesPar = [
      { remetenteId: usuario.id, destinatarioId: resultado.tecnico.id },
      { remetenteId: resultado.tecnico.id, destinatarioId: usuario.id }
    ];
    const where = { [Op.or]: condicoesPar };
    if (after !== undefined) {
      where.id = { [Op.gt]: Number(after) };
    }
    const mensagens = await MensagemEquipe.findAll({
      where,
      include: [{ model: Usuario, as: 'remetente', attributes: ['id', 'nome'] }],
      order: [['id', after === undefined ? 'DESC' : 'ASC']],
      limit: 100
    });
    if (after === undefined) {
      mensagens.reverse();
    }
    return res.json({
      mensagens: mensagens.map(mensagem => ({
        id: mensagem.id,
        texto: mensagem.texto,
        data: mensagem.data_criacao,
        autor: mensagem.remetente
      }))
    });
  } catch (erro) {
    console.error('Erro ao carregar mensagens da equipe:', erro);
    return res.status(500).json({ erro: 'Não foi possível carregar as mensagens.' });
  }
};

exports.enviarMensagemEquipe = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const resultado = await validarColegaEquipe(usuario, req.params.tecnicoId);
    if (resultado.erro) {
      return res.status(resultado.erro.status).json({ erro: resultado.erro.mensagem });
    }
    const texto = typeof req.body.texto === 'string' ? req.body.texto.trim() : '';
    if (!texto || texto.length > 2000) {
      return res.status(400).json({ erro: 'A mensagem deve conter de 1 a 2.000 caracteres.' });
    }
    const mensagem = await MensagemEquipe.create({
      remetenteId: usuario.id,
      destinatarioId: resultado.tecnico.id,
      texto
    });
    await registrarAuditoria(req, {
      acao: 'mensagem_equipe_enviada',
      entidade: 'mensagem_equipe',
      entidadeId: mensagem.id,
      detalhes: { remetenteId: usuario.id, destinatarioId: resultado.tecnico.id }
    });
    return res.status(201).json({
      mensagem: {
        id: mensagem.id,
        texto: mensagem.texto,
        data: mensagem.data_criacao,
        autor: { id: usuario.id, nome: usuario.nome }
      }
    });
  } catch (erro) {
    console.error('Erro ao enviar mensagem à equipe:', erro);
    return res.status(500).json({ erro: 'Não foi possível enviar a mensagem.' });
  }
};
