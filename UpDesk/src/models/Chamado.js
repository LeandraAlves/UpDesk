const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');
const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Departamento = require('./Departamento');

const Chamado = sequelize.define('Chamado', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  titulo: { type: DataTypes.STRING, allowNull: false },
  descricao: { type: DataTypes.TEXT, allowNull: false },
  prioridade: { 
    type: DataTypes.ENUM('baixa', 'media', 'alta'), 
    defaultValue: 'media' 
  },
  status: { 
    type: DataTypes.ENUM('aberto', 'em_andamento', 'fechado'), 
    defaultValue: 'aberto' 
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Usuario, key: 'id' }
  },
  categoriaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Categoria, key: 'id' }
  },
  departamentoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Departamento, key: 'id' }
  }
}, {
  tableName: 'chamados',
  timestamps: true
});

// Associações
Chamado.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'solicitante' });
Chamado.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
Chamado.belongsTo(Departamento, { foreignKey: 'departamentoId', as: 'departamento' });

module.exports = Chamado;