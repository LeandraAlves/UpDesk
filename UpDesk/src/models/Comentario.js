const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');

const Comentario = sequelize.define('Comentario', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  texto: { type: DataTypes.TEXT, allowNull: false },
  chamadoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'chamados', key: 'id' }
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' }
  },
  data_criacao: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'comentarios',
  timestamps: false
});

module.exports = Comentario;
