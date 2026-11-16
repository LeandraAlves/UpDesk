function autenticado(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect('/autenticacao/login');
  }

  return next();
}

function administrador(req, res, next) {
  if (!['admin', 'gerencia'].includes(req.session.usuario.perfil)) {
    return res.status(403).send('Acesso permitido somente para administradores.');
  }

  return next();
}

module.exports = { autenticado, administrador };
