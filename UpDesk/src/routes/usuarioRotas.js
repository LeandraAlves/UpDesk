const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Responde a GET /usuarios
router.get('/', usuarioController.listar);

// Responde a POST /usuarios/cadastrar
router.post('/cadastrar', usuarioController.cadastrar);

module.exports = router;