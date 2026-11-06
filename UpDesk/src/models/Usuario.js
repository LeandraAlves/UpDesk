const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  senha_hash: { type: DataTypes.STRING, allowNull: false },
  perfil: { type: DataTypes.ENUM('admin', 'usuario'), defaultValue: 'usuario' }
}, {
  tableName: 'usuarios',
  timestamps: true
});

module.exports = Usuario;