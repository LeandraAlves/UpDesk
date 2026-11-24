const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');
const { administrador } = require('../middlewares/autenticacao');

router.use(administrador);
router.get('/', departamentoController.gerenciar);
router.post('/novo', departamentoController.cadastrar);
router.post('/editar/:id', departamentoController.editar);
router.post('/excluir/:id', departamentoController.excluir);

module.exports = router;