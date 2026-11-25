const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');
const { autenticado } = require('../middlewares/autenticacao');

router.use(autenticado);
router.get('/', auditoriaController.listar);

module.exports = router;
