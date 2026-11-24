const { Op } = require('sequelize');
const TipoUsuario = require('../models/TipoUsuario');
const validarCamposTipoUsuario = require('../utils/validarCamposTipoUsuario');

exports.listar = async (req, res) => {
  try {
    const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';
    if (busca.length > 100) {
      return res.status(400).send('A pesquisa deve ter no máximo 100 caracteres.');
    }
    const tiposUsuario = await TipoUsuario.findAll({
      where: busca ? { nome: { [Op.like]: `%${busca}%` } } : {},
      order: [['nome', 'ASC']]
    });
    res.render('tiposUsuario/index', {
      usuario: req.session.usuario,
      tiposUsuario,
      busca,
      sucesso: typeof req.query.sucesso === 'string' ? req.query.sucesso : ''
    });
  } catch (erro) {
    console.error('Erro ao carregar tipos de usuário:', erro);
    res.status(500).send('Erro ao carregar tipos de usuário.');
  }
};

exports.cadastrar = async (req, res) => {
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  const descricao = typeof req.body.descricao === 'string' ? req.body.descricao.trim() : '';

  const erroValidacao = validarCamposTipoUsuario(nome, descricao);
  if (erroValidacao) {
    return res.status(400).send(erroValidacao);
  }

  try {
    await TipoUsuario.create({ nome, descricao: descricao || null });
    return res.redirect('/tipos-usuario?sucesso=criado');
  } catch (erro) {
    console.error('Erro ao cadastrar tipo de usuário:', erro);
    return res.status(500).send('Erro ao cadastrar tipo de usuário.');
  }
};

exports.editar = async (req, res) => {
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  const descricao = typeof req.body.descricao === 'string' ? req.body.descricao.trim() : '';

  const erroValidacao = validarCamposTipoUsuario(nome, descricao);
  if (erroValidacao) {
    return res.status(400).send(erroValidacao);
  }

  try {
    const tipoUsuario = await TipoUsuario.findByPk(req.params.id);
    if (!tipoUsuario) {
      return res.status(404).send('Tipo de usuário não encontrado.');
    }

    await tipoUsuario.update({ nome, descricao: descricao || null });
    return res.redirect('/tipos-usuario?sucesso=editado');
  } catch (erro) {
    console.error('Erro ao editar tipo de usuário:', erro);
    return res.status(500).send('Erro ao editar tipo de usuário.');
  }
};

exports.excluir = async (req, res) => {
  try {
    const tipoUsuario = await TipoUsuario.findByPk(req.params.id);
    if (!tipoUsuario) {
      return res.status(404).send('Tipo de usuário não encontrado.');
    }

    if (await tipoUsuario.countUsuarios()) {
      return res.status(409).send('Não é possível excluir um tipo de usuário que está atribuído a usuários.');
    }
    await tipoUsuario.destroy();
    return res.redirect('/tipos-usuario?sucesso=excluido');
  } catch (erro) {
    if (erro.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).send('Não é possível excluir um tipo de usuário que está atribuído a usuários.');
    }

    console.error('Erro ao excluir tipo de usuário:', erro);
    return res.status(500).send('Erro ao excluir tipo de usuário.');
  }
};