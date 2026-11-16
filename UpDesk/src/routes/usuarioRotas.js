const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { administrador } = require('../middlewares/autenticacao');

router.use(administrador);
router.get('/', usuarioController.listar);
router.post('/cadastrar', usuarioController.cadastrar);

module.exports = router;