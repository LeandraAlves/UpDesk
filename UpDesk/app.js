const express = require('express');
const session = require('express-session');
const path = require('path');
const sequelize = require('./src/config/banco');
const { Usuario } = require('./src/models');
const { autenticado } = require('./src/middlewares/autenticacao');

const sessionSecret = process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === 'production' ? null : 'updesk-local-development-secret-change-me');

if (!sessionSecret) {
  throw new Error('Defina SESSION_SECRET no ambiente de produção.');
}

const app = express();

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
const categoriaRotas = require('./src/routes/categoriaRotas');
const departamentoRotas = require('./src/routes/departamentoRotas');
const usuarioRotas = require('./src/routes/usuarioRotas');
const chamadoRotas = require('./src/routes/chamadoRotas');
const tiRotas = require('./src/routes/tiRotas');

// --- REGISTO DE ROTAS ---
app.get('/', (req, res) => {
  res.redirect('/autenticacao/login');
});

app.get('/inicio', autenticado, (req, res) => {
  if (req.session.usuario.perfil === 'cliente') {
    return res.redirect('/chamados');
  }
  if (req.session.usuario.perfil === 'tecnico') {
    return res.redirect('/ti/chamados-abertos');
  }
  res.render('inicio', { usuario: req.session.usuario });
});

// Módulos do sistema
app.use('/autenticacao', autenticacaoRotas);
app.use('/categorias', autenticado, categoriaRotas);
app.use('/departamentos', autenticado, departamentoRotas);
app.use('/usuarios', autenticado, usuarioRotas);
app.use('/chamados', autenticado, chamadoRotas);
app.use('/ti', autenticado, tiRotas);

// --- SINCRONIZAÇÃO COM O BANCO E START DO SERVIDOR ---
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
  .then(async () => {
    const [usuariosAtualizados] = await Usuario.update(
      { perfil: 'tecnico' },
      { where: { perfil: 'usuario' } }
    );
    if (usuariosAtualizados > 0) {
      console.log(`${usuariosAtualizados} usuário(s) migrado(s) para o perfil técnico.`);
    }

    console.log('Banco de dados sincronizado com sucesso.');
    app.listen(PORT, () => {
      console.log(`Servidor a correr em http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar com o banco de dados:', err);
  });