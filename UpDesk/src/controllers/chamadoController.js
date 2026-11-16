const Chamado = require('../models/Chamado');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Departamento = require('../models/Departamento');

exports.listar = async (req, res) => {
  try {
    const where = ['admin', 'gerencia'].includes(req.session.usuario.perfil)
      ? {}
      : { usuarioId: req.session.usuario.id };
    const chamados = await Chamado.findAll({
      where,
      include: [
        { model: Usuario, as: 'solicitante' },
        { model: Categoria, as: 'categoria' },
        { model: Departamento, as: 'departamento' }
      ],
      order: [['id', 'DESC']]
    });

    const categorias = await Categoria.findAll();
    const departamentos = await Departamento.findAll();

    res.render('chamados', {
      usuario: req.session.usuario,
      chamados,
      categorias,
      departamentos
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao carregar chamados.');
  }
};

exports.cadastrar = async (req, res) => {
  const { titulo, descricao, prioridade, categoriaId, departamentoId } = req.body;
  try {
    await Chamado.create({
      titulo,
      descricao,
      prioridade,
      status: 'aberto',
      usuarioId: req.session.usuario.id,
      categoriaId: categoriaId || null,
      departamentoId: departamentoId || null
    });

    res.redirect('/chamados');
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao cadastrar chamado.');
  }
};