function validarCamposCategoria(nome, descricao) {
  if (!nome) {
    return 'O nome da categoria é obrigatório.';
  }
  if (nome.length > 255) {
    return 'O nome da categoria deve ter no máximo 255 caracteres.';
  }
  if (descricao.length > 255) {
    return 'A descrição da categoria deve ter no máximo 255 caracteres.';
  }
  return null;
}

module.exports = validarCamposCategoria;
