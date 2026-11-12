const express = require('express');
const session = require('express-session');
const sequelize = require('./src/config/banco');

// Importação dos ficheiros de rotas
const autenticacaoRotas = require('./src/routes/autenticacaoRotas');
const categoriaRotas = require('./src/routes/categoriaRotas');
const departamentoRotas = require('./src/routes/departamentoRotas');

const app = express();

// Configurações de Middlewares e Views
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './src/views');

// Configuração da Sessão
app.use(session({
  secret: 'chave_secreta_updesk',
  resave: false,
  saveUninitialized: false
}));

// Registo das Rotas no Express
app.use('/autenticacao', autenticacaoRotas);
app.use('/categorias', categoriaRotas);
app.use('/departamentos', departamentoRotas);

// Rota para a Tela de Início limpa (após o login)
app.get('/inicio', (req, res) => {
  res.render('inicio', { 
    usuario: req.session.usuario || { nome: 'Gerencia', perfil: 'admin' } 
  });
});

// Rota Raiz: Redireciona obrigatoriamente para o login ao iniciar
app.get('/', (req, res) => {
  res.redirect('/autenticacao/login');
});

// Inicialização do Servidor e Sincronização do Banco
const PORTA = process.env.PORT || 3000;
sequelize.sync({ alter: true }).then(() => {
  console.log('Banco de dados conectado e sincronizado!');
  app.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`);
  });
}).catch(erro => {
  console.error('Erro ao conectar ao banco de dados:', erro);
});