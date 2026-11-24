const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');

const MensagemEquipe = sequelize.define('MensagemEquipe', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  texto: { type: DataTypes.TEXT, allowNull: false },
  remetenteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' }
  },
  destinatarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' }
  },
  data_criacao: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'mensagens_equipe',
  timestamps: false
});

module.exports = MensagemEquipe;
