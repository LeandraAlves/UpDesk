const express = require('express');
const session = require('express-session');
const sequelize = require('./src/config/banco');
const autenticacaoRotas = require('./src/routes/autenticacaoRotas');
const categoriaRotas = require('./src/routes/categoriaRotas');

const app = express();

// Configuração do Express e EJS
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './src/views');

// Sessão do usuário
app.use(session({
  secret: 'chave_secreta_updesk',
  resave: false,
  saveUninitialized: false
}));

// Rotas da aplicação
app.use('/autenticacao', autenticacaoRotas);
app.use('/categorias', categoriaRotas);

app.get('/', (req, res) => {
  res.redirect('/autenticacao/login');
});

// Sincronização do banco de dados e inicialização do servidor
const PORTA = process.env.PORT || 3000;
sequelize.sync({ alter: true }).then(() => {
  console.log('Banco de dados conectado e sincronizado!');
  app.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`);
  });
}).catch(erro => {
  console.error('Erro ao conectar ao banco de dados:', erro);
});