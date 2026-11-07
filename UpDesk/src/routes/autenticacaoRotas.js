const express = require('express');
const router = express.Router();
const authController = require('../controllers/autenticacaoController');

router.get('/login', authController.renderizarLogin);
router.post('/login', authController.login);
router.get('/cadastro', authController.renderizarCadastro);
router.post('/cadastro', authController.cadastrar);
router.get('/logout', authController.logout);

module.exports = router;