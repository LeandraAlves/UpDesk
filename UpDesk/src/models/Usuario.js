const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');
const Categoria = require('./Categoria');
const Departamento = require('./Departamento');

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  senha_hash: { type: DataTypes.STRING, allowNull: false },
  perfil: { 
    type: DataTypes.ENUM('admin', 'usuario', 'cliente'), // Adicionado 'cliente' aqui
    defaultValue: 'usuario' 
  },
  categoriaId: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    references: {
      model: Categoria,
      key: 'id'
    }
  },
  departamentoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Departamento,
      key: 'id'
    }
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

module.exports = Usuario;