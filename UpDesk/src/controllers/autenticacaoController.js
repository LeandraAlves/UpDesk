const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');

exports.renderizarLogin = (req, res) => {
  res.render('login');
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) return res.send('Usuário não encontrado.');

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) return res.send('Senha incorreta.');

    req.session.usuario = { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil };
    res.redirect('/categorias');
  } catch (erro) {
    res.status(500).send('Erro interno do servidor.');
  }
};

exports.renderizarCadastro = (req, res) => {
  res.render('cadastro');
};

exports.cadastrar = async (req, res) => {
  const { nome, email, senha, perfil } = req.body;
  try {
    const senha_hash = await bcrypt.hash(senha, 10);
    await Usuario.create({ nome, email, senha_hash, perfil });
    res.redirect('/autenticacao/login');
  } catch (erro) {
    res.status(500).send('Erro ao cadastrar usuário.');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/autenticacao/login');
  });
};