const express = require('express');
const router = express.Router();
const chamadoController = require('../controllers/chamadoController');

router.get('/', chamadoController.listar);
router.post('/cadastrar', chamadoController.cadastrar);

module.exports = router;
