const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');

const Categoria = sequelize.define('Categoria', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  descricao: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'categorias',
  timestamps: true
});

module.exports = Categoria;