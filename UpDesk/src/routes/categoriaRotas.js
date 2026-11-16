const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { administrador } = require('../middlewares/autenticacao');

router.use(administrador);
router.get('/', categoriaController.listar);
router.post('/cadastrar', categoriaController.cadastrar);
router.post('/editar/:id', categoriaController.editar);
router.post('/excluir/:id', categoriaController.excluir);

module.exports = router;