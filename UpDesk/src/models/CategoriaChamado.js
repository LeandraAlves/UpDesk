const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');
const Departamento = require('./Departamento');

const CategoriaChamado = sequelize.define('CategoriaChamado', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  descricao: { type: DataTypes.TEXT, allowNull: true },
  departamentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Departamento, key: 'id' }
  }
}, {
  tableName: 'categorias_chamado',
  timestamps: true
});

module.exports = CategoriaChamado;
