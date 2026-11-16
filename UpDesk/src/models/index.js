const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Departamento = require('./Departamento');
const Chamado = require('./Chamado');
const Comentario = require('./Comentario');
const Etiqueta = require('./Etiqueta');
const ChamadoEtiqueta = require('./ChamadoEtiqueta');

Usuario.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
Categoria.hasMany(Usuario, { foreignKey: 'categoriaId', as: 'usuarios' });
Usuario.belongsTo(Departamento, { foreignKey: 'departamentoId', as: 'departamento' });
Departamento.hasMany(Usuario, { foreignKey: 'departamentoId', as: 'usuarios' });

Chamado.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'solicitante' });
Usuario.hasMany(Chamado, { foreignKey: 'usuarioId', as: 'chamados' });
Chamado.belongsTo(Usuario, { foreignKey: 'tecnicoId', as: 'tecnico' });
Usuario.hasMany(Chamado, { foreignKey: 'tecnicoId', as: 'chamadosAtribuidos' });

Chamado.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
Categoria.hasMany(Chamado, { foreignKey: 'categoriaId', as: 'chamados' });
Chamado.belongsTo(Departamento, { foreignKey: 'departamentoId', as: 'departamento' });
Departamento.hasMany(Chamado, { foreignKey: 'departamentoId', as: 'chamados' });

Comentario.belongsTo(Chamado, { foreignKey: 'chamadoId', as: 'chamado' });
Chamado.hasMany(Comentario, { foreignKey: 'chamadoId', as: 'comentarios' });
Comentario.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'autor' });
Usuario.hasMany(Comentario, { foreignKey: 'usuarioId', as: 'comentarios' });

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
  Categoria,
  Departamento,
  Chamado,
  Comentario,
  Etiqueta,
  ChamadoEtiqueta
};
