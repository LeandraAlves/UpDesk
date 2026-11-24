const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');
const Usuario = require('./Usuario');
const CategoriaChamado = require('./CategoriaChamado');
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
    type: DataTypes.ENUM('aberto', 'em_andamento', 'aguardando', 'fechado', 'cancelado'),
    defaultValue: 'aberto' 
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Usuario, key: 'id' }
  },
  categoriaChamadoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: CategoriaChamado, key: 'id' }
  },
  departamentoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Departamento, key: 'id' }
  },
  tecnicoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Usuario, key: 'id' }
  },
  prazo: {
    type: DataTypes.DATE,
    allowNull: true
  },
  local: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'chamados',
  timestamps: true
});

module.exports = Chamado;