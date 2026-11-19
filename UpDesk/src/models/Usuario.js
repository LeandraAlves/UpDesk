const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');
const Categoria = require('./Categoria');

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  senha_hash: { type: DataTypes.STRING, allowNull: false },
  perfil: {
    type: DataTypes.STRING,
    defaultValue: 'usuario',
    validate: {
      isIn: [['admin', 'usuario', 'cliente', 'gerencia']]
    }
  },
  categoriaId: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    references: {
      model: Categoria,
      key: 'id'
    }
  }
}, {
  tableName: 'usuarios',
  timestamps: true
});

Usuario.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
Categoria.hasMany(Usuario, { foreignKey: 'categoriaId', as: 'usuarios' });

module.exports = Usuario;