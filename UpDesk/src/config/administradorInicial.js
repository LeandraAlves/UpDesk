const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

async function criarAdministradorInicial() {
  if (await Usuario.count({ where: { perfil: 'admin' } })) {
    return;
  }

  const email = typeof process.env.ADMIN_EMAIL === 'string'
    ? process.env.ADMIN_EMAIL.trim().toLowerCase()
    : '';
  const nome = typeof process.env.ADMIN_NOME === 'string' && process.env.ADMIN_NOME.trim()
    ? process.env.ADMIN_NOME.trim()
    : 'Administrador';
  const senha = process.env.ADMIN_SENHA || '';
  if (!email || !senha) {
    console.warn('Nenhum administrador existe. Configure ADMIN_EMAIL e ADMIN_SENHA para criar o primeiro acesso administrativo.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    throw new Error('ADMIN_EMAIL precisa ser um e-mail válido com até 255 caracteres.');
  }
  if (nome.length > 255) {
    throw new Error('ADMIN_NOME deve ter no máximo 255 caracteres.');
  }
  if (senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
    throw new Error('ADMIN_SENHA precisa ter de 8 a 72 bytes.');
  }

  const usuarioExistente = await Usuario.findOne({ where: { email } });
  if (usuarioExistente) {
    throw new Error('ADMIN_EMAIL já está cadastrado com outro perfil; não foi promovido automaticamente.');
  }

  const senha_hash = await bcrypt.hash(senha, 12);
  await Usuario.create({
    nome,
    email,
    senha_hash,
    perfil: 'admin'
  });
  console.log('Administrador inicial criado. Defina ADMIN_EMAIL e ADMIN_SENHA fora do repositório.');
}

module.exports = criarAdministradorInicial;
