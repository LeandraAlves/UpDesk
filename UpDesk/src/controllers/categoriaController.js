const Categoria = require('../models/Categoria');

exports.listar = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.render('categorias', {
      usuario: req.session.usuario || { nome: 'Gerencia', perfil: 'admin' },
      categorias
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao carregar categorias.');
  }
};

exports.cadastrar = async (req, res) => {
  const { nome } = req.body;
  try {
    await Categoria.create({ nome });
    res.redirect('/categorias');
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao cadastrar categoria.');
  }
};

// Nova função para excluir categoria
exports.excluir = async (req, res) => {
  const { id } = req.params;
  try {
    await Categoria.destroy({
      where: { id }
    });
    res.redirect('/categorias');
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao excluir categoria. Certifique-se de que não existem registos associados.');
  }
};