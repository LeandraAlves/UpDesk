const { Op } = require('sequelize');
const Usuario = require('../models/Usuario');
const TipoUsuario = require('../models/TipoUsuario');
const Departamento = require('../models/Departamento');
const Chamado = require('../models/Chamado');
const Comentario = require('../models/Comentario');
const bcrypt = require('bcrypt');
const usuarioDeveTerDepartamento = require('../utils/usuarioDeveTerDepartamento');

exports.listar = async (req, res) => {
  try {
    const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';
    if (busca.length > 100) {
      return res.status(400).send('A pesquisa deve ter no máximo 100 caracteres.');
    }
    const usuarios = await Usuario.findAll({
      where: busca ? {
        [Op.or]: [
          { nome: { [Op.like]: `%${busca}%` } },
          { email: { [Op.like]: `%${busca}%` } }
        ]
      } : {},
      include: [{ model: TipoUsuario, as: 'tipoUsuario' }]
    });
    const tiposUsuario = await TipoUsuario.findAll();
    const departamentos = await Departamento.findAll();

    res.render('usuarios', {
      usuario: req.session.usuario || { nome: 'Gerencia', perfil: 'admin' },
      usuarios,
      tiposUsuario,
      departamentos,
      busca,
      sucesso: typeof req.query.sucesso === 'string' ? req.query.sucesso : ''
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao carregar utilizadores.');
  }
};

exports.excluir = async (req, res) => {
  if (!/^[1-9]\d*$/.test(String(req.params.id))) {
    return res.status(400).send('Identificador de usuário inválido.');
  }
  const id = Number(req.params.id);
  if (id === req.session.usuario.id) {
    return res.status(409).send('Não é possível excluir sua própria conta.');
  }
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).send('Usuário não encontrado.');
    }
    const [chamadosSolicitados, chamadosAtribuidos, comentarios] = await Promise.all([
      Chamado.count({ where: { usuarioId: id } }),
      Chamado.count({ where: { tecnicoId: id } }),
      Comentario.count({ where: { usuarioId: id } })
    ]);
    if (chamadosSolicitados || chamadosAtribuidos || comentarios) {
      return res.status(409).send('Não é possível excluir um usuário com chamados ou mensagens associados.');
    }
    await usuario.destroy();
    return res.redirect('/usuarios?sucesso=excluido');
  } catch (erro) {
    if (erro.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).send('Não é possível excluir um usuário que possui registros associados.');
    }
    console.error('Erro ao excluir usuário:', erro);
    return res.status(500).send('Não foi possível excluir o usuário.');
  }
};

exports.cadastrar = async (req, res) => {
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const senha = typeof req.body.senha === 'string' ? req.body.senha : '';
  const { perfil } = req.body;
  const tipoUsuarioId = req.body.tipoUsuarioId ? Number(req.body.tipoUsuarioId) : null;
  const departamentoInformado = req.body.departamentoId;

  if (!['admin', 'tecnico', 'cliente'].includes(perfil)) {
    return res.status(400).send('Perfil inválido.');
  }
  if (!nome || !email || !senha || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).send('Informe nome, e-mail válido e senha.');
  }
  if (nome.length > 255 || email.length > 255) {
    return res.status(400).send('Nome ou e-mail excedem o limite permitido.');
  }
  if (senha.length < 8) {
    return res.status(400).send('A senha deve ter pelo menos 8 caracteres.');
  }
  if (Buffer.byteLength(senha, 'utf8') > 72) {
    return res.status(400).send('A senha deve ter no máximo 72 bytes.');
  }
  if (!Number.isInteger(tipoUsuarioId) || tipoUsuarioId < 1) {
    return res.status(400).send('Selecione um tipo de usuário válido.');
  }

  try {
    const tipoUsuario = await TipoUsuario.findByPk(tipoUsuarioId);
    if (!tipoUsuario) {
      return res.status(400).send('O tipo de usuário selecionado não existe.');
    }

    let departamentoId = null;
    if (perfil === 'tecnico' || usuarioDeveTerDepartamento(perfil, tipoUsuario.nome)) {
      if (
        typeof departamentoInformado !== 'string' ||
        !/^[1-9]\d*$/.test(departamentoInformado)
      ) {
        return res.status(400).send('Selecione um departamento válido.');
      }

      departamentoId = Number(departamentoInformado);
      if (!await Departamento.findByPk(departamentoId)) {
        return res.status(400).send('O departamento selecionado não existe.');
      }
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    await Usuario.create({
      nome,
      email,
      senha_hash,
      perfil,
      tipoUsuarioId,
      departamentoId
    });

    return res.redirect('/usuarios?sucesso=criado');
  } catch (erro) {
    if (erro.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send('Este e-mail já está cadastrado.');
    }
    console.error(erro);
    return res.status(500).send('Erro ao cadastrar usuário.');
  }
};