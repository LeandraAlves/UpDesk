const Chamado = require('../models/Chamado');
const Usuario = require('../models/Usuario');

exports.painelTi = (req, res) => {
  res.render('inicioTi', { 
    usuario: req.session.usuario
  });
};

exports.listarChamadosAbertos = async (req, res) => {
  try {
    const chamadosAbertos = await Chamado.findAll({
      where: { status: 'aberto' },
      include: [
        { 
          model: Usuario, 
          as: 'solicitante',
          where: { perfil: 'cliente' }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.render('inicioTi', {
      usuario: req.session.usuario,
      chamadosAbertos: chamadosAbertos || []
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).send('Erro ao carregar chamados em aberto.');
  }
};