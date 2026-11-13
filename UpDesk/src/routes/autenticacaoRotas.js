const express = require('express');
const router = express.Router();
const autenticacaoController = require('../controllers/autenticacaoController');

// Linha 5 (ou por volta disso): Certifica-te de que autenticacaoController.renderizarLogin existe e é uma função
router.get('/login', autenticacaoController.renderizarLogin);
router.post('/login', autenticacaoController.login);

router.get('/cadastro', (req, res) => {
  res.render('cadastro'); // Se estiver direto na rota, tem de ser uma função (req, res) => {}
});
router.post('/cadastrar', autenticacaoController.cadastrar);

module.exports = router;