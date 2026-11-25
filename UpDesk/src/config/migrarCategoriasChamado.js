const { DataTypes, QueryTypes } = require('sequelize');
const sequelize = require('./banco');
const Chamado = require('../models/Chamado');
const CategoriaChamado = require('../models/CategoriaChamado');

module.exports = async function migrarCategoriasChamado() {
  const queryInterface = sequelize.getQueryInterface();
  const colunas = await queryInterface.describeTable('chamados');
  if (!colunas.categoriaChamadoId) {
    await queryInterface.addColumn('chamados', 'categoriaChamadoId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'categorias_chamado', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  }

  if (!colunas.categoriaId || !colunas.departamentoId) return;
  const chamadosLegados = await sequelize.query(
    'SELECT id, `categoriaId`, `departamentoId` FROM `chamados` ' +
      'WHERE `categoriaId` IS NOT NULL AND `departamentoId` IS NOT NULL ' +
      'AND `categoriaChamadoId` IS NULL',
    { type: QueryTypes.SELECT }
  );

  for (const chamadoLegado of chamadosLegados) {
    const [categoriaLegada] = await sequelize.query(
      'SELECT `nome`, `descricao` FROM `categorias` WHERE `id` = ? LIMIT 1',
      {
        replacements: [chamadoLegado.categoriaId],
        type: QueryTypes.SELECT
      }
    );
    if (!categoriaLegada) continue;
    const [categoria] = await CategoriaChamado.findOrCreate({
      where: {
        nome: categoriaLegada.nome,
        departamentoId: chamadoLegado.departamentoId
      },
      defaults: {
        descricao: categoriaLegada.descricao
      }
    });
    await Chamado.update(
      { categoriaChamadoId: categoria.id },
      {
        where: {
          id: chamadoLegado.id,
          categoriaChamadoId: null
        }
      }
    );
  }
};
