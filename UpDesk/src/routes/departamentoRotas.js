const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');
const { administrador } = require('../middlewares/autenticacao');

router.use(administrador);
router.get('/', departamentoController.gerenciar);
router.post('/novo', departamentoController.cadastrar);

module.exports = router;