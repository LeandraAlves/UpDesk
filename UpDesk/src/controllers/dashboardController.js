const Chamado = require('../models/Chamado');
const CategoriaChamado = require('../models/CategoriaChamado');
const Departamento = require('../models/Departamento');
const Usuario = require('../models/Usuario');

exports.exibir = async (req, res) => {
  try {
    const chamados = await Chamado.findAll({
      attributes: ['id', 'titulo', 'status', 'prioridade', 'prazo', 'createdAt'],
      include: [
        { model: CategoriaChamado, as: 'categoria', attributes: ['id', 'nome'] },
        { model: Departamento, as: 'departamento', attributes: ['id', 'nome'] },
        { model: Usuario, as: 'solicitante', attributes: ['nome'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const countsByStatus = new Map();
    const countsByCategoria = new Map();
    const countsByDepartamento = new Map();
    const nomesCategoria = new Map();
    const nomesDepartamento = new Map();
    const agora = new Date();
    let atrasados = 0;

    chamados.forEach((chamado) => {
      countsByStatus.set(chamado.status, (countsByStatus.get(chamado.status) || 0) + 1);
      if (chamado.categoria) {
        countsByCategoria.set(chamado.categoria.id, (countsByCategoria.get(chamado.categoria.id) || 0) + 1);
        nomesCategoria.set(chamado.categoria.id, chamado.categoria.nome);
      }
      if (chamado.departamento) {
        countsByDepartamento.set(chamado.departamento.id, (countsByDepartamento.get(chamado.departamento.id) || 0) + 1);
        nomesDepartamento.set(chamado.departamento.id, chamado.departamento.nome);
      }
      if (
        chamado.prazo &&
        new Date(chamado.prazo) < agora &&
        !['fechado', 'cancelado'].includes(chamado.status)
      ) {
        atrasados += 1;
      }
    });

    const toChartItems = (counts, nomes) => {
      const sorted = Array.from(counts, ([id, total]) => ({ id, nome: nomes.get(id), total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      const max = Math.max(1, ...sorted.map((item) => item.total));
      return sorted.map((item) => ({ ...item, percent: Math.round(item.total / max * 100) }));
    };

    const statusLabels = {
      aberto: 'Abertos',
      em_andamento: 'Em andamento',
      aguardando: 'Aguardando',
      fechado: 'Resolvidos',
      cancelado: 'Cancelados'
    };
    const statusChart = Array.from(countsByStatus, ([status, total]) => ({
      status,
      nome: statusLabels[status] || status,
      total
    }));

    res.render('inicio', {
      usuario: req.session.usuario,
      totalChamados: chamados.length,
      emAndamento: countsByStatus.get('em_andamento') || 0,
      aguardando: countsByStatus.get('aguardando') || 0,
      finalizados: countsByStatus.get('fechado') || 0,
      atrasados,
      statusChart,
      categoriasChart: toChartItems(countsByCategoria, nomesCategoria),
      departamentosChart: toChartItems(countsByDepartamento, nomesDepartamento),
      ultimosChamados: chamados.slice(0, 5)
    });
  } catch (erro) {
    console.error('Erro ao carregar dashboard:', erro);
    res.status(500).send('Erro ao carregar o painel.');
  }
};
