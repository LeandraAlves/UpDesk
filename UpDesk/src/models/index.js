const Usuario = require('./Usuario');
const TipoUsuario = require('./TipoUsuario');
const CategoriaChamado = require('./CategoriaChamado');
const Departamento = require('./Departamento');
const Chamado = require('./Chamado');
const Comentario = require('./Comentario');
const MensagemEquipe = require('./MensagemEquipe');
const Etiqueta = require('./Etiqueta');
const ChamadoEtiqueta = require('./ChamadoEtiqueta');

Usuario.belongsTo(TipoUsuario, { foreignKey: 'tipoUsuarioId', as: 'tipoUsuario' });
TipoUsuario.hasMany(Usuario, { foreignKey: 'tipoUsuarioId', as: 'usuarios' });
Usuario.belongsTo(Departamento, { foreignKey: 'departamentoId', as: 'departamento' });
Departamento.hasMany(Usuario, { foreignKey: 'departamentoId', as: 'usuarios' });

Chamado.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'solicitante' });
Usuario.hasMany(Chamado, { foreignKey: 'usuarioId', as: 'chamados' });
Chamado.belongsTo(Usuario, { foreignKey: 'tecnicoId', as: 'tecnico' });
Usuario.hasMany(Chamado, { foreignKey: 'tecnicoId', as: 'chamadosAtribuidos' });

CategoriaChamado.belongsTo(Departamento, { foreignKey: 'departamentoId', as: 'departamento' });
Departamento.hasMany(CategoriaChamado, { foreignKey: 'departamentoId', as: 'categoriasChamado' });
Chamado.belongsTo(CategoriaChamado, { foreignKey: 'categoriaChamadoId', as: 'categoria' });
CategoriaChamado.hasMany(Chamado, { foreignKey: 'categoriaChamadoId', as: 'chamados' });
Chamado.belongsTo(Departamento, { foreignKey: 'departamentoId', as: 'departamento' });
Departamento.hasMany(Chamado, { foreignKey: 'departamentoId', as: 'chamados' });

Comentario.belongsTo(Chamado, { foreignKey: 'chamadoId', as: 'chamado' });
Chamado.hasMany(Comentario, { foreignKey: 'chamadoId', as: 'comentarios' });
Comentario.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'autor' });
Usuario.hasMany(Comentario, { foreignKey: 'usuarioId', as: 'comentarios' });

MensagemEquipe.belongsTo(Usuario, { foreignKey: 'remetenteId', as: 'remetente' });
MensagemEquipe.belongsTo(Usuario, { foreignKey: 'destinatarioId', as: 'destinatario' });
Usuario.hasMany(MensagemEquipe, { foreignKey: 'remetenteId', as: 'mensagensEnviadas' });
Usuario.hasMany(MensagemEquipe, { foreignKey: 'destinatarioId', as: 'mensagensRecebidas' });

Chamado.belongsToMany(Etiqueta, {
  through: ChamadoEtiqueta,
  foreignKey: 'chamadoId',
  otherKey: 'etiquetaId',
  as: 'etiquetas'
});
Etiqueta.belongsToMany(Chamado, {
  through: ChamadoEtiqueta,
  foreignKey: 'etiquetaId',
  otherKey: 'chamadoId',
  as: 'chamados'
});

module.exports = {
  Usuario,
  TipoUsuario,
  CategoriaChamado,
  Departamento,
  Chamado,
  Comentario,
  MensagemEquipe,
  Etiqueta,
  ChamadoEtiqueta
};
