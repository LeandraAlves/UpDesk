const Categoria = require('../models/Categoria');

// Renderiza a página completa e unificada de categorias (formulário + listagem)
exports.gerenciar = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.render('categorias/index', { 
      categorias: categorias || [], 
      usuario: req.session.usuario || { nome: 'Gerencia', perfil: 'admin' } 
    });
  } catch (error) {
    console.error('ERRO AO CARREGAR CATEGORIAS:', error);
    res.status(500).send('Erro interno ao carregar categorias: ' + error.message);
  }
};

// Processa o novo cadastro e redireciona de volta para a mesma página
exports.cadastrar = async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    await Categoria.create({ nome, descricao });
    res.redirect('/categorias');
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).send('Erro interno ao cadastrar categoria: ' + error.message);
  }
};