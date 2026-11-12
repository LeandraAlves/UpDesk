const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');

// A rota raiz do módulo (/departamentos) chama a função gerenciar
router.get('/', departamentoController.gerenciar);

// A rota POST chama a função cadastrar
router.post('/novo', departamentoController.cadastrar);

module.exports = router;