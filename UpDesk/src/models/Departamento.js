const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');

const Departamento = sequelize.define('Departamento', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  nome: { 
    type: DataTypes.STRING, 
    allowNull: false,
    unique: true 
  },
  descricao: { 
    type: DataTypes.STRING, 
    allowNull: true 
  }
}, {
  tableName: 'departamentos',
  timestamps: true
});

module.exports = Departamento;