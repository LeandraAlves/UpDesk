const express = require('express');
const session = require('express-session');
const path = require('path');
const sequelize = require('./src/config/banco');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const app = express();
const production = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET ||
  (production ? null : 'updesk-local-development-secret-change-me');

if (!sessionSecret) {
  throw new Error('Defina SESSION_SECRET nas variáveis de ambiente de produção.');
}

app.set('trust proxy', 1);

// Configuração do EJS como template engine e views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Middlewares para leitura de dados de formulários e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  expiration: 24 * 60 * 60 * 1000
});

let erroInicializacao = null;
const bancoPronto = sequelize.sync()
  .then(() => sessionStore.sync())
  .then(() => {
    console.log('Banco de dados sincronizado com sucesso.');
  })
  .catch((erro) => {
    erroInicializacao = erro;
    console.error('Erro ao preparar o banco de dados:', erro);
  });

app.use(async (req, res, next) => {
  await bancoPronto;
  if (erroInicializacao) {
    return res.status(503).send('Serviço temporariamente indisponível.');
  }
  return next();
});

app.use(session({
  secret: sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  proxy: production,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: production,
    maxAge: 24 * 60 * 60 * 1000
  }
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

// Inicialização local (apenas fora da Vercel)
if (!production) {
  const PORT = Number(process.env.PORT) || 3000;
  bancoPronto.then(() => {
    if (!erroInicializacao) {
      app.listen(PORT, () => {
        console.log(`Servidor a correr em http://localhost:${PORT}`);
      });
    }
  });
}

module.exports = app;