const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

router.get('/', categoriaController.listar);
router.post('/cadastrar', categoriaController.cadastrar);
router.get('/excluir/:id', categoriaController.excluir); // Essencial para o link funcionar

module.exports = router;