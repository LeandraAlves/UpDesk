const express = require('express');
const router = express.Router();
const tiController = require('../controllers/tiController'); // Certifica-te de que "../controllers/tiController" está correto

router.get('/', tiController.painelTi);
router.get('/chamados-abertos', tiController.listarChamadosAbertos);

module.exports = router;