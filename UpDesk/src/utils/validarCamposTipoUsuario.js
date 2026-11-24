function validarCamposTipoUsuario(nome, descricao) {
  if (!nome) {
    return 'O nome do tipo de usuário é obrigatório.';
  }
  if (nome.length > 255) {
    return 'O nome do tipo de usuário deve ter no máximo 255 caracteres.';
  }
  if (descricao.length > 255) {
    return 'A descrição do tipo de usuário deve ter no máximo 255 caracteres.';
  }
  return null;
}

module.exports = validarCamposTipoUsuario;
