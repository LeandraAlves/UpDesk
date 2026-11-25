const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');

const RegistroAuditoria = sequelize.define('RegistroAuditoria', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  atorId: { type: DataTypes.INTEGER, allowNull: true },
  atorNome: { type: DataTypes.STRING, allowNull: false },
  atorPerfil: { type: DataTypes.STRING, allowNull: false },
  acao: { type: DataTypes.STRING(64), allowNull: false },
  entidade: { type: DataTypes.STRING(64), allowNull: false },
  entidadeId: { type: DataTypes.STRING(64), allowNull: true },
  transferidoParaId: { type: DataTypes.INTEGER, allowNull: true },
  detalhes: { type: DataTypes.JSON, allowNull: false }
}, {
  tableName: 'registros_auditoria',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['createdAt'] },
    { fields: ['acao', 'transferidoParaId'] }
  ]
});

module.exports = RegistroAuditoria;
