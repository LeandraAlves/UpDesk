const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoriaChamadoController');
const { somenteAdministrador } = require('../middlewares/autenticacao');

router.use(somenteAdministrador);
router.get('/', controller.listar);
router.post('/cadastrar', controller.cadastrar);
router.post('/editar/:id', controller.editar);
router.post('/excluir/:id', controller.excluir);

module.exports = router;
