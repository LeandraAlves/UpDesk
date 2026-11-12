const Departamento = require('../models/Departamento');

// Renderiza a página completa do módulo de departamentos quando clicas em "Departamentos"
exports.gerenciar = async (req, res) => {
  try {
    const departamentos = await Departamento.findAll();
    res.render('departamentos/index', { 
      departamentos: departamentos || [], 
      usuario: req.session.usuario || { nome: 'Gerencia', perfil: 'admin' } 
    });
  } catch (error) {
    console.error('ERRO AO CARREGAR DEPARTAMENTOS:', error);
    res.status(500).send('Erro interno ao carregar departamentos: ' + error.message);
  }
};

// Processa o novo departamento e recarrega a mesma página
exports.cadastrar = async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    await Departamento.create({ nome, descricao });
    res.redirect('/departamentos');
  } catch (error) {
    console.error('Erro ao criar departamento:', error);
    res.status(500).send('Erro interno ao cadastrar departamento: ' + error.message);
  }
};