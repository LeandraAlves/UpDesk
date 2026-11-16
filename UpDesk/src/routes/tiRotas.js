const express = require('express');
const router = express.Router();
const tiController = require('../controllers/tiController');
const { tecnicoOuAdministrador } = require('../middlewares/autenticacao');

router.use(tecnicoOuAdministrador);
router.get('/', tiController.painelTi);
router.get('/chamados-abertos', tiController.listarChamadosAbertos);

module.exports = router;