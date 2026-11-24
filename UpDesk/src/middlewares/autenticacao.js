function autenticado(req, res, next) {
  if (!req.session || !req.session.usuario) {
    return res.redirect('/autenticacao/login');
  }

  return next();
}

function administrador(req, res, next) {
  const perfil = req.session && req.session.usuario && req.session.usuario.perfil;
  if (!['admin', 'gerencia'].includes(perfil)) {
    return res.status(403).send('Acesso permitido somente para administradores.');
  }
  return next();
}

function somenteAdministrador(req, res, next) {
  const perfil = req.session && req.session.usuario && req.session.usuario.perfil;
  if (perfil !== 'admin') {
    return res.status(403).send('Acesso permitido somente para administradores.');
  }
  return next();
}

function tecnicoOuAdministrador(req, res, next) {
  const perfil = req.session && req.session.usuario && req.session.usuario.perfil;
  if (!['admin', 'tecnico'].includes(perfil)) {
    return res.status(403).send('Acesso permitido somente para técnicos e administradores.');
  }

  return next();
}

module.exports = { autenticado, administrador, somenteAdministrador, tecnicoOuAdministrador };
