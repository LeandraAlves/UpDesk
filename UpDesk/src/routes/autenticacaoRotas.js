const express = require('express');
const router = express.Router();
const autenticacaoController = require('../controllers/autenticacaoController');

router.get('/login', autenticacaoController.renderizarLogin);
router.post('/login', autenticacaoController.login);
router.get('/cadastro', autenticacaoController.renderizarCadastro);
router.post('/cadastro', autenticacaoController.cadastrar);
router.post('/logout', autenticacaoController.logout);

module.exports = router;