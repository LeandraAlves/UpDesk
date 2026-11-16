const Categoria = require('../models/Categoria');

exports.listar = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.render('categorias/index', {
      usuario: req.session.usuario,
      categorias
    });
  } catch (erro) {
    console.error('Erro ao carregar categorias:', erro);
    res.status(500).send('Erro ao carregar categorias.');
  }
};

exports.cadastrar = async (req, res) => {
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  const descricao = typeof req.body.descricao === 'string' ? req.body.descricao.trim() : '';

  if (!nome) {
    return res.status(400).send('O nome da categoria é obrigatório.');
  }

  try {
    await Categoria.create({ nome, descricao: descricao || null });
    return res.redirect('/categorias');
  } catch (erro) {
    console.error('Erro ao cadastrar categoria:', erro);
    return res.status(500).send('Erro ao cadastrar categoria.');
  }
};

exports.editar = async (req, res) => {
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  const descricao = typeof req.body.descricao === 'string' ? req.body.descricao.trim() : '';

  if (!nome) {
    return res.status(400).send('O nome da categoria é obrigatório.');
  }

  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) {
      return res.status(404).send('Categoria não encontrada.');
    }

    await categoria.update({ nome, descricao: descricao || null });
    return res.redirect('/categorias');
  } catch (erro) {
    console.error('Erro ao editar categoria:', erro);
    return res.status(500).send('Erro ao editar categoria.');
  }
};

exports.excluir = async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) {
      return res.status(404).send('Categoria não encontrada.');
    }

    await categoria.destroy();
    return res.redirect('/categorias');
  } catch (erro) {
    if (erro.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).send('Não é possível excluir uma categoria que possui chamados ou usuários associados.');
    }

    console.error('Erro ao excluir categoria:', erro);
    return res.status(500).send('Erro ao excluir categoria.');
  }
};