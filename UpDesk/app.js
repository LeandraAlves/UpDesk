const express = require('express');
const session = require('express-session');
const path = require('path');
const sequelize = require('./src/config/banco');
const { Usuario } = require('./src/models');
const { autenticado } = require('./src/middlewares/autenticacao');
const dashboardController = require('./src/controllers/dashboardController');
const criarAdministradorInicial = require('./src/config/administradorInicial');
const migrarCategoriasChamado = require('./src/config/migrarCategoriasChamado');

const sessionSecret = process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === 'production' ? null : 'updesk-local-development-secret-change-me');

if (!sessionSecret) {
  throw new Error('Defina SESSION_SECRET no ambiente de produção.');
}

const app = express();
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Configuração do EJS como template engine e views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Middlewares para leitura de dados de formulários e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração da Sessão
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// --- IMPORTAÇÃO DE ROTAS ---
const autenticacaoRotas = require('./src/routes/autenticacaoRotas');
const categoriaChamadoRotas = require('./src/routes/categoriaChamadoRotas');
const departamentoRotas = require('./src/routes/departamentoRotas');
const usuarioRotas = require('./src/routes/usuarioRotas');
const chamadoRotas = require('./src/routes/chamadoRotas');
const tiRotas = require('./src/routes/tiRotas');

// --- REGISTO DE ROTAS ---
app.get('/', (req, res) => {
  res.redirect('/autenticacao/login');
});

app.get('/inicio', autenticado, (req, res, next) => {
  if (req.session.usuario.perfil === 'cliente') {
    return res.redirect('/chamados');
  }
  if (req.session.usuario.perfil === 'tecnico') {
    return res.redirect('/ti');
  }
  if (!['admin', 'gerencia'].includes(req.session.usuario.perfil)) {
    return res.status(403).send('Acesso permitido somente para administradores.');
  }
  return dashboardController.exibir(req, res, next);
});

// Módulos do sistema
app.use('/autenticacao', autenticacaoRotas);
app.use('/categorias', autenticado, categoriaChamadoRotas);
app.use('/departamentos', autenticado, departamentoRotas);
app.use('/usuarios', autenticado, usuarioRotas);
app.use('/chamados', autenticado, chamadoRotas);
app.use('/ti', autenticado, tiRotas);

// --- SINCRONIZAÇÃO COM O BANCO E START DO SERVIDOR ---
const PORT = process.env.PORT || 3000;

sequelize.sync()
  .then(async () => {
    await migrarCategoriasChamado();
    const [usuariosAtualizados] = await Usuario.update(
      { perfil: 'cliente' },
      { where: { perfil: 'usuario' } }
    );
    if (usuariosAtualizados > 0) {
      console.log(`${usuariosAtualizados} usuário(s) migrado(s) para o perfil cliente.`);
    }
    await criarAdministradorInicial();

    console.log('Banco de dados sincronizado com sucesso.');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((erro) => {
    console.error('Erro ao iniciar o servidor:', erro);
    process.exitCode = 1;
  });