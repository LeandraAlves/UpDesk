const categoriasSemDepartamento = new Set(['cliente', 'gerencia']);

function usuarioDeveTerDepartamento(perfil, nomeTipoUsuario) {
  const tipoUsuario = typeof nomeTipoUsuario === 'string'
    ? nomeTipoUsuario.trim().toLowerCase()
    : '';

  return perfil !== 'cliente' && !categoriasSemDepartamento.has(tipoUsuario);
}

module.exports = usuarioDeveTerDepartamento;
