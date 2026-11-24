const { Sequelize } = require('sequelize');
const path = require('path');

// Carrega o .env apenas se estiver localmente (no Render ele pega do painel)
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const portaBanco = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
if (!Number.isInteger(portaBanco) || portaBanco < 1 || portaBanco > 65535) {
  throw new Error('DB_PORT deve ser uma porta válida entre 1 e 65535.');
}

const sequelize = new Sequelize(
  process.env.DB_NOME,
  process.env.DB_USUARIO,
  process.env.DB_SENHA,
  {
    host: process.env.DB_HOST,
    port: portaBanco,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Obrigatório para o certificado SSL do Aiven
      }
    }
  }
);

module.exports = sequelize;