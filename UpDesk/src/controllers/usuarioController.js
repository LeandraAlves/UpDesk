const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Departamento = require('../models/Departamento'); // Importa o modelo de Departamentos
const bcrypt = require('bcrypt');

exports.listar = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [{ model: Categoria, as: 'categoria' }]
    });
    const categorias = await Categoria.findAll();
    const departamentos = await Departamento.findAll(); // Busca os departamentos

    res.render('usuarios', {
      usuario: req.session.usuario || { nome: 'Gerencia', perfil: 'admin' },
      usuarios,
      categorias,
      departamentos // Envia para a view
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao carregar utilizadores.');
  }
};

exports.cadastrar = async (req, res) => {
  const { nome, email, senha, perfil, categoriaId, departamentoId } = req.body;
  try {
    const senha_hash = await bcrypt.hash(senha, 10);
    
    const usuario = await Usuario.create({
      nome,
      email,
      senha_hash,
      perfil,
      categoriaId: categoriaId || null,
      departamentoId: departamentoId || null // Se houver departamento associado
    });

    if (categoriaId) {
      const categoria = await Categoria.findByPk(categoriaId);
      
      // Se a categoria for diferente de 'Gerencia', em vez de redirecionar bruscamente, 
      // podes direcionar para a gestão de departamentos passando o ID do usuário criado
      if (categoria && categoria.nome.trim().toLowerCase() !== 'gerencia') {
        return res.redirect(`/departamentos?usuarioId=${usuario.id}`);
      }
    }

    res.redirect('/usuarios');
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao cadastrar utilizador.');
  }
};