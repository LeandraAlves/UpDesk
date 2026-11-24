const express = require('express');
const router = express.Router();
const tiController = require('../controllers/tiController');
const { tecnicoOuAdministrador, somenteAdministrador } = require('../middlewares/autenticacao');

router.use(tecnicoOuAdministrador);
router.get('/', tiController.painelTi);
router.get('/chamados-abertos', tiController.listarChamadosAbertos);
router.get('/equipe', tiController.equipe);
router.get('/equipe/:tecnicoId/mensagens', tiController.listarMensagensEquipe);
router.post('/equipe/:tecnicoId/mensagens', tiController.enviarMensagemEquipe);
router.get('/desempenho', somenteAdministrador, tiController.desempenho);

module.exports = router;