const Chamado = require('../models/Chamado');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Departamento = require('../models/Departamento');

exports.listar = async (req, res) => {
  try {
    const chamados = await Chamado.findAll({
      include: [
        { model: Usuario, as: 'solicitante' },
        { model: Categoria, as: 'categoria' },
        { model: Departamento, as: 'departamento' }
      ],
      order: [['id', 'DESC']]
    });

    const categorias = await Categoria.findAll();
    const departamentos = await Departamento.findAll();
    const usuarios = await Usuario.findAll();

    res.render('chamados', {
      usuario: req.session.usuario || { id: 1, nome: 'Gerencia', perfil: 'admin' },
      chamados,
      categorias,
      departamentos,
      usuarios
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao carregar chamados.');
  }
};

exports.cadastrar = async (req, res) => {
  const { titulo, descricao, prioridade, categoriaId, departamentoId, usuarioId } = req.body;
  try {
    // Usa o ID do solicitante escolhido no form ou o ID do usuário logado na sessão
    const idSolicitante = usuarioId || (req.session.usuario ? req.session.usuario.id : 1);

    await Chamado.create({
      titulo,
      descricao,
      prioridade,
      status: 'aberto',
      usuarioId: idSolicitante,
      categoriaId: categoriaId || null,
      departamentoId: departamentoId || null
    });

    res.redirect('/chamados');
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao cadastrar chamado.');
  }
};