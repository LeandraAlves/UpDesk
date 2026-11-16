const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

module.exports = {
  renderizarLogin(req, res) {
    return res.render('login', { erro: null, cadastro: req.query.cadastro });
  },

  renderizarCadastro(req, res) {
    return res.render('cadastro', { erro: null });
  },

  async cadastrar(req, res) {
    const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const senha = typeof req.body.senha === 'string' ? req.body.senha : '';
    const confirmaSenha = typeof req.body.confirmaSenha === 'string' ? req.body.confirmaSenha : '';

    if (!nome || !email || !senha || !confirmaSenha) {
      return res.status(400).render('cadastro', { erro: 'Preencha todos os campos.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).render('cadastro', { erro: 'Informe um e-mail válido.' });
    }

    if (senha !== confirmaSenha) {
      return res.status(400).render('cadastro', { erro: 'As senhas não conferem.' });
    }

    if (senha.length < 8) {
      return res.status(400).render('cadastro', { erro: 'A senha deve ter pelo menos 8 caracteres.' });
    }

    try {
      const senha_hash = await bcrypt.hash(senha, 12);
      await Usuario.create({ nome, email, senha_hash, perfil: 'cliente' });
      return res.redirect('/autenticacao/login?cadastro=sucesso');
    } catch (erro) {
      if (erro.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).render('cadastro', { erro: 'Este e-mail já está cadastrado.' });
      }

      console.error('Erro ao cadastrar usuário:', erro);
      return res.status(500).render('cadastro', { erro: 'Não foi possível concluir o cadastro.' });
    }
  },

  async login(req, res) {
    try {
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const senha = typeof req.body.senha === 'string' ? req.body.senha : '';
      const usuario = await Usuario.findOne({ where: { email } });
      const senhaValida = usuario && await bcrypt.compare(senha, usuario.senha_hash);

      if (!senhaValida) {
        return res.status(401).render('login', { erro: 'E-mail ou senha inválidos.' });
      }

      req.session.regenerate((erro) => {
        if (erro) {
          console.error('Erro ao iniciar sessão:', erro);
          return res.status(500).send('Não foi possível iniciar a sessão.');
        }

        req.session.usuario = {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil
        };

        return res.redirect(usuario.perfil === 'cliente' ? '/chamados' : '/inicio');
      });
    } catch (erro) {
      console.error('Erro crítico no login:', erro);
      return res.status(500).render('login', { erro: 'Erro interno ao autenticar.' });
    }
  },

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Erro ao destruir sessão:', err);
        return res.status(500).send('Não foi possível encerrar a sessão.');
      }
      res.clearCookie('connect.sid');
      return res.redirect('/autenticacao/login');
    });
  }
};