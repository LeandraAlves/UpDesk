const { DataTypes } = require('sequelize');
const sequelize = require('../config/banco');

const ChamadoEtiqueta = sequelize.define('ChamadoEtiqueta', {
  chamadoId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'chamados', key: 'id' }
  },
  etiquetaId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: { model: 'etiquetas', key: 'id' }
  }
}, {
  tableName: 'chamado_etiquetas',
  timestamps: false
});

module.exports = ChamadoEtiqueta;
