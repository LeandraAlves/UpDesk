const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaChamadoController');
const { somenteAdministrador } = require('../middlewares/autenticacao');

router.use(somenteAdministrador);
router.get('/', categoriaController.listar);
router.post('/cadastrar', categoriaController.cadastrar);
router.post('/editar/:id', categoriaController.editar);
router.post('/excluir/:id', categoriaController.excluir);

module.exports = router;