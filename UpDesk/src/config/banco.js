const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NOME || 'updesk_db',
  process.env.DB_USUARIO || 'root',
  process.env.DB_SENHA || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false
  }
);

module.exports = sequelize;