const { Op } = require('sequelize');
const Usuario = require('../models/Usuario');
const Departamento = require('../models/Departamento');
const Chamado = require('../models/Chamado');
const Comentario = require('../models/Comentario');
const bcrypt = require('bcryptjs');
const registrarAuditoria = require('../utils/registrarAuditoria');

async function renderizarUsuarios(req, res, usuarioEdicao = null) {
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
      } : {}
    });
    const departamentos = await Departamento.findAll();

    res.render('usuarios', {
      usuario: req.session.usuario || { nome: 'Gerencia', perfil: 'admin' },
      usuarios,
      departamentos,
      usuarioEdicao,
      busca,
      sucesso: typeof req.query.sucesso === 'string' ? req.query.sucesso : ''
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao carregar utilizadores.');
  }
}

exports.listar = (req, res) => renderizarUsuarios(req, res);

exports.editarForm = async (req, res) => {
  if (!/^[1-9]\d*$/.test(String(req.params.id))) {
    return res.status(400).send('Identificador de usuário inválido.');
  }
  try {
    const usuarioEdicao = await Usuario.findByPk(Number(req.params.id));
    if (!usuarioEdicao) {
      return res.status(404).send('Usuário não encontrado.');
    }
    return renderizarUsuarios(req, res, usuarioEdicao);
  } catch (erro) {
    console.error('Erro ao carregar usuário para edição:', erro);
    return res.status(500).send('Não foi possível carregar o usuário.');
  }
};

exports.editar = async (req, res) => {
  if (!/^[1-9]\d*$/.test(String(req.params.id))) {
    return res.status(400).send('Identificador de usuário inválido.');
  }

  const id = Number(req.params.id);
  const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const senha = typeof req.body.senha === 'string' ? req.body.senha : '';
  const perfil = req.body.perfil;
  const departamentoInformado = req.body.departamentoId;

  if (!['admin', 'tecnico', 'cliente'].includes(perfil)) {
    return res.status(400).send('Perfil inválido.');
  }
  if (!nome || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).send('Informe nome e e-mail válido.');
  }
  if (nome.length > 255 || email.length > 255) {
    return res.status(400).send('Nome ou e-mail excedem o limite permitido.');
  }
  if (senha && (senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72)) {
    return res.status(400).send('A senha deve ter de 8 a 72 bytes.');
  }

  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).send('Usuário não encontrado.');
    }
    if (usuario.perfil === 'admin' && perfil !== 'admin' &&
        await Usuario.count({ where: { perfil: 'admin' } }) <= 1) {
      return res.status(409).send('O sistema precisa manter pelo menos um administrador.');
    }
    if (id === req.session.usuario.id && perfil !== 'admin') {
      return res.status(409).send('Não é possível remover o perfil de administrador da própria conta.');
    }

    let departamentoId = null;
    if (perfil === 'tecnico') {
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

    const atualizacao = { nome, email, perfil, departamentoId };
    if (senha) {
      atualizacao.senha_hash = await bcrypt.hash(senha, 10);
    }
    const antes = {
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      departamentoId: usuario.departamentoId
    };
    await usuario.update(atualizacao);
    await registrarAuditoria(req, {
      acao: 'usuario_editado',
      entidade: 'usuario',
      entidadeId: usuario.id,
      detalhes: {
        antes,
        depois: { nome, email, perfil, departamentoId },
        senhaRedefinida: Boolean(senha)
      }
    });

    if (id === req.session.usuario.id) {
      Object.assign(req.session.usuario, { nome, email, perfil, departamentoId });
    }
    return res.redirect('/usuarios?sucesso=editado');
  } catch (erro) {
    if (erro.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).send('Este e-mail já está cadastrado.');
    }
    console.error('Erro ao editar usuário:', erro);
    return res.status(500).send('Não foi possível atualizar o usuário.');
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
    await registrarAuditoria(req, {
      acao: 'usuario_excluido',
      entidade: 'usuario',
      entidadeId: id,
      detalhes: { nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
    });
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
  try {
    let departamentoId = null;
    if (perfil === 'tecnico') {
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

    const usuario = await Usuario.create({
      nome,
      email,
      senha_hash,
      perfil,
      departamentoId
    });
    await registrarAuditoria(req, {
      acao: 'usuario_criado',
      entidade: 'usuario',
      entidadeId: usuario.id,
      detalhes: { nome, email, perfil, departamentoId }
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