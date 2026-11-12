const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

// A rota raiz do módulo (/categorias) carrega a tela completa
router.get('/', categoriaController.gerenciar);

// Rota para submeter o formulário de nova categoria
router.post('/novo', categoriaController.cadastrar);

module.exports = router;