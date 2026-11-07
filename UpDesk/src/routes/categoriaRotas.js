const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

router.get('/', categoriaController.listar);
router.post('/criar', categoriaController.criar);
router.post('/editar/:id', categoriaController.atualizar);
router.post('/excluir/:id', categoriaController.excluir);

module.exports = router;