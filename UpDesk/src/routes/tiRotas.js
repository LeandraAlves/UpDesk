const express = require('express');
const router = express.Router();
const tiController = require('../controllers/tiController');
const { administrador } = require('../middlewares/autenticacao');

router.use(administrador);
router.get('/', tiController.painelTi);
router.get('/chamados-abertos', tiController.listarChamadosAbertos);

module.exports = router;