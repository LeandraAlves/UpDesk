const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const bcrypt = require('bcrypt');

exports.renderizarLogin = (req, res) => {
  res.render('login');
};

exports.renderizarCadastro = (req, res) => {
  res.render('cadastro');
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;
  
  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.send('Utilizador não encontrado. <a href="/autenticacao/login">Voltar</a>');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.send('Senha incorreta. <a href="/autenticacao/login">Voltar</a>');
    }

    // Guarda os dados na sessão
    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    };

    // Se for cliente ou utilizador comum, vai direto para os chamados
    if (usuario.perfil === 'cliente' || usuario.perfil === 'usuario') {
      return res.redirect('/chamados');
    }

    return res.redirect('/inicio');
  } catch (erro) {
    console.error('Erro no login:', erro);
    return res.status(500).send('Erro interno no servidor.');
  }
};

exports.cadastrar = async (req, res) => {
  const { nome, email, senha } = req.body;
  
  try {
    const senha_hash = await bcrypt.hash(senha, 10);
    let categoriaCliente = await Categoria.findOne({ where: { nome: 'Cliente' } });

    await Usuario.create({
      nome,
      email,
      senha_hash,
      perfil: 'cliente', // Registo público sempre como cliente
      categoriaId: categoriaCliente ? categoriaCliente.id : null
    });

    return res.redirect('/autenticacao/login');
  } catch (erro) {
    console.error('Erro ao cadastrar:', erro);
    return res.status(500).send('Erro ao realizar o cadastro.');
  }
};