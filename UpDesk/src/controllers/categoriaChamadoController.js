const { Op } = require('sequelize');
const CategoriaChamado = require('../models/CategoriaChamado');
const Departamento = require('../models/Departamento');
const registrarAuditoria = require('../utils/registrarAuditoria');

function validarId(id) {
  return /^[1-9]\d*$/.test(String(id));
}

exports.listar = async (req, res) => {
  const filtros = {
    busca: typeof req.query.busca === 'string' ? req.query.busca.trim() : '',
    departamentoId: typeof req.query.departamentoId === 'string' ? req.query.departamentoId : ''
  };
  if (filtros.busca.length > 100) {
    return res.status(400).send('A pesquisa deve ter no máximo 100 caracteres.');
  }
  if (filtros.departamentoId && !/^[1-9]\d*$/.test(filtros.departamentoId)) {
    return res.status(400).send('Departamento inválido para filtro.');
  }
  try {
    const where = {};
    if (filtros.busca) where.nome = { [Op.like]: `%${filtros.busca}%` };
    if (filtros.departamentoId) where.departamentoId = Number(filtros.departamentoId);
    const [categorias, departamentos] = await Promise.all([
      CategoriaChamado.findAll({
        where,
        include: [{ model: Departamento, as: 'departamento', attributes: ['id', 'nome'] }],
        order: [['nome', 'ASC']]
      }),
      Departamento.findAll({ order: [['nome', 'ASC']] })
    ]);
    return res.render('categorias/chamados', {
      usuario: req.session.usuario,
      categorias,
      departamentos,
      filtros,
      sucesso: typeof req.query.sucesso === 'string' ? req.query.sucesso : '',
      erro: ''
    });
  } catch (erro) {
    console.error('Erro ao carregar categorias de chamados:', erro);
    return res.status(500).send('Não foi possível carregar as categorias de chamados.');
  }
};

exports.cadastrar = async (req, res) => {
  const body = req.body || {};
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
  const departamentoId = Number(body.departamentoId);
  if (!nome || nome.length > 255 || descricao.length > 1000 ||
      !Number.isSafeInteger(departamentoId) || departamentoId < 1) {
    return res.status(400).send('Informe nome, descrição válida e departamento para a categoria.');
  }
  try {
    if (!await Departamento.findByPk(departamentoId)) {
      return res.status(400).send('O departamento selecionado não existe.');
    }
    const categoria = await CategoriaChamado.create({ nome, descricao: descricao || null, departamentoId });
    await registrarAuditoria(req, {
      acao: 'categoria_criada',
      entidade: 'categoria',
      entidadeId: categoria.id,
      detalhes: { nome, descricao: descricao || null, departamentoId }
    });
    return res.redirect('/categorias?sucesso=criado');
  } catch (erro) {
    console.error('Erro ao cadastrar categoria de chamado:', erro);
    return res.status(500).send('Não foi possível cadastrar a categoria de chamado.');
  }
};

exports.editar = async (req, res) => {
  if (!validarId(req.params.id)) {
    return res.status(400).send('Identificador de categoria inválido.');
  }
  const body = req.body || {};
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
  const departamentoId = Number(body.departamentoId);
  if (!nome || nome.length > 255 || descricao.length > 1000 ||
      !Number.isSafeInteger(departamentoId) || departamentoId < 1) {
    return res.status(400).send('Informe nome, descrição válida e departamento para a categoria.');
  }
  try {
    const [categoria, departamento] = await Promise.all([
      CategoriaChamado.findByPk(Number(req.params.id)),
      Departamento.findByPk(departamentoId)
    ]);
    if (!categoria) return res.status(404).send('Categoria de chamado não encontrada.');
    if (!departamento) return res.status(400).send('O departamento selecionado não existe.');
    if (categoria.departamentoId !== departamento.id && await categoria.countChamados()) {
      return res.status(409).send('Não é possível trocar o departamento de uma categoria que já possui chamados.');
    }
    const antes = {
      nome: categoria.nome,
      descricao: categoria.descricao,
      departamentoId: categoria.departamentoId
    };
    await categoria.update({ nome, descricao: descricao || null, departamentoId });
    await registrarAuditoria(req, {
      acao: 'categoria_editada',
      entidade: 'categoria',
      entidadeId: categoria.id,
      detalhes: {
        antes,
        depois: { nome, descricao: descricao || null, departamentoId }
      }
    });
    return res.redirect('/categorias?sucesso=editado');
  } catch (erro) {
    console.error('Erro ao editar categoria de chamado:', erro);
    return res.status(500).send('Não foi possível editar a categoria de chamado.');
  }
};

exports.excluir = async (req, res) => {
  if (!validarId(req.params.id)) {
    return res.status(400).send('Identificador de categoria inválido.');
  }
  try {
    const categoria = await CategoriaChamado.findByPk(Number(req.params.id));
    if (!categoria) return res.status(404).send('Categoria de chamado não encontrada.');
    if (await categoria.countChamados()) {
      return res.status(409).send('Não é possível excluir uma categoria que possui chamados associados.');
    }
    const dadosCategoria = {
      id: categoria.id,
      nome: categoria.nome,
      descricao: categoria.descricao,
      departamentoId: categoria.departamentoId
    };
    await categoria.destroy();
    await registrarAuditoria(req, {
      acao: 'categoria_excluida',
      entidade: 'categoria',
      entidadeId: categoria.id,
      detalhes: dadosCategoria
    });
    return res.redirect('/categorias?sucesso=excluido');
  } catch (erro) {
    console.error('Erro ao excluir categoria de chamado:', erro);
    return res.status(500).send('Não foi possível excluir a categoria de chamado.');
  }
};
