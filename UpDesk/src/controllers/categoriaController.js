const Categoria = require('../models/Categoria');

exports.listar = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.render('categorias/index', { categorias, usuario: req.session.usuario });
  } catch (erro) {
    res.status(500).send('Erro ao listar categorias.');
  }
};

exports.criar = async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    await Categoria.create({ nome, descricao });
    res.redirect('/categorias');
  } catch (erro) {
    res.status(500).send('Erro ao criar categoria.');
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;
    await Categoria.update({ nome, descricao }, { where: { id } });
    res.redirect('/categorias');
  } catch (erro) {
    res.status(500).send('Erro ao atualizar categoria.');
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    await Categoria.destroy({ where: { id } });
    res.redirect('/categorias');
  } catch (erro) {
    res.status(500).send('Erro ao excluir categoria.');
  }
};