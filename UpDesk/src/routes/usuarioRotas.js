const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { administrador } = require('../middlewares/autenticacao');

router.use(administrador);
router.get('/', usuarioController.listar);
router.get('/editar/:id', usuarioController.editarForm);
router.post('/cadastrar', usuarioController.cadastrar);
router.post('/editar/:id', usuarioController.editar);
router.post('/excluir/:id', usuarioController.excluir);

module.exports = router;