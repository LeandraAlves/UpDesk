const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');

const Etiqueta = sequelize.define('Etiqueta', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING, allowNull: false, unique: true }
}, {
  tableName: 'etiquetas',
  timestamps: true
});

module.exports = Etiqueta;
