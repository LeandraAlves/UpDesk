const express = require('express');
const session = require('express-session');
const path = require('path');
const sequelize = require('./src/config/banco');

const app = express();

// Configuração do EJS como template engine e views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middlewares para leitura de dados de formulários e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração da Sessão
app.use(session({
  secret: 'updesk_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// --- IMPORTAÇÃO DE ROTAS ---
const autenticacaoRotas = require('./src/routes/autenticacaoRotas');
const categoriaRotas = require('./src/routes/categoriaRotas');
const departamentoRotas = require('./src/routes/departamentoRotas');
const usuarioRotas = require('./src/routes/usuarioRotas');
const chamadoRotas = require('./src/routes/chamadoRotas');
const tiRotas = require('./src/routes/tiRotas');

// --- REGISTO DE ROTAS ---
app.get('/', (req, res) => {
  res.redirect('/autenticacao/login');
});

app.get('/inicio', (req, res) => {
  if (!req.session.usuario) {
    return res.redirect('/autenticacao/login');
  }
  // Se um cliente tentar aceder ao /inicio, é redirecionado de volta para os chamados
  if (req.session.usuario.perfil === 'cliente' || req.session.usuario.perfil === 'usuario') {
    return res.redirect('/chamados');
  }
  res.render('inicio', { usuario: req.session.usuario });
});

// Módulos do sistema
app.use('/autenticacao', autenticacaoRotas);
app.use('/categorias', categoriaRotas);
app.use('/departamentos', departamentoRotas);
app.use('/usuarios', usuarioRotas);
app.use('/chamados', chamadoRotas);
app.use('/ti', tiRotas);

// --- SINCRONIZAÇÃO COM O BANCO ---
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Banco de dados sincronizado com sucesso.');
  })
  .catch(err => {
    console.error('Erro ao conectar com o banco de dados:', err);
  });

// Inicialização local (apenas fora da Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
  });
}

module.exports = app;