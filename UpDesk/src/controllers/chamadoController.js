const { Op } = require('sequelize');
const Chamado = require('../models/Chamado');
const ChamadoEtiqueta = require('../models/ChamadoEtiqueta');
const Comentario = require('../models/Comentario');
const Etiqueta = require('../models/Etiqueta');
const Usuario = require('../models/Usuario');
const CategoriaChamado = require('../models/CategoriaChamado');
const Departamento = require('../models/Departamento');
const { calcularPrazo } = require('../utils/prazoChamado');
const registrarAuditoria = require('../utils/registrarAuditoria');
const notificacaoEmail = require('../services/notificacaoEmail');

const prioridades = ['baixa', 'media', 'alta'];
const statusPermitidos = ['aberto', 'em_andamento', 'aguardando', 'fechado'];
const ehAdmin = (usuario) => ['admin', 'gerencia'].includes(usuario.perfil);
const ehTecnico = (usuario) => usuario.perfil === 'tecnico';

function podeAcessar(chamado, usuario) {
  if (ehAdmin(usuario)) {
    return true;
  }
  if (ehTecnico(usuario)) {
    return usuario.departamentoId !== null && usuario.departamentoId !== undefined &&
      chamado.departamentoId === usuario.departamentoId &&
      (chamado.tecnicoId === usuario.id ||
        (chamado.tecnicoId === null && chamado.status === 'aberto'));
  }
  return chamado.usuarioId === usuario.id;
}

function validarId(id) {
  return /^\d+$/.test(String(id)) && Number(id) > 0;
}

function dataIsoValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }
  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia;
}

async function buscarChamado(id) {
  if (!validarId(id)) {
    return null;
  }
  return Chamado.findByPk(id, {
    include: [
      { model: Usuario, as: 'solicitante', attributes: ['id', 'nome', 'email'] },
      { model: Usuario, as: 'tecnico', attributes: ['id', 'nome', 'email'] },
      { model: CategoriaChamado, as: 'categoria' },
      { model: Departamento, as: 'departamento' },
      { model: Etiqueta, as: 'etiquetas' }
    ]
  });
}

async function carregarOpcoes() {
  const [categorias, departamentos, tecnicos] = await Promise.all([
    CategoriaChamado.findAll({
      include: [{ model: Departamento, as: 'departamento', attributes: ['id', 'nome'] }],
      order: [['nome', 'ASC']]
    }),
    Departamento.findAll({ order: [['nome', 'ASC']] }),
    Usuario.findAll({
      where: { perfil: 'tecnico' },
      attributes: ['id', 'nome', 'departamentoId'],
      order: [['nome', 'ASC']]
    })
  ]);
  return { categorias, departamentos, tecnicos };
}

exports.listar = async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const filtros = {
      busca: typeof req.query.busca === 'string' ? req.query.busca.trim() : '',
      status: typeof req.query.status === 'string' ? req.query.status : '',
      categoriaId: typeof req.query.categoriaId === 'string' ? req.query.categoriaId : '',
      departamentoId: typeof req.query.departamentoId === 'string' ? req.query.departamentoId : '',
      dataInicio: typeof req.query.dataInicio === 'string' ? req.query.dataInicio : '',
      dataFim: typeof req.query.dataFim === 'string' ? req.query.dataFim : '',
      prioridade: typeof req.query.prioridade === 'string' ? req.query.prioridade : '',
      usuarioId: typeof req.query.usuarioId === 'string' ? req.query.usuarioId : ''
    };

    if (!ehAdmin(usuario) && !ehTecnico(usuario)) {
      filtros.busca = '';
      filtros.status = '';
      filtros.categoriaId = '';
      filtros.departamentoId = '';
      filtros.dataInicio = '';
      filtros.dataFim = '';
      filtros.prioridade = '';
      filtros.usuarioId = '';
    }

    if ((filtros.dataInicio && !dataIsoValida(filtros.dataInicio)) ||
        (filtros.dataFim && !dataIsoValida(filtros.dataFim))) {
      return res.status(400).send('Informe datas válidas para filtrar os chamados.');
    }
    if (filtros.busca.length > 100) {
      return res.status(400).send('A pesquisa deve ter no máximo 100 caracteres.');
    }
    if (filtros.status && !statusPermitidos.concat(['cancelado', 'pendente']).includes(filtros.status)) {
      return res.status(400).send('Status inválido para filtro.');
    }
    if ((filtros.categoriaId && !/^[1-9]\d*$/.test(filtros.categoriaId)) ||
        (filtros.departamentoId && !/^[1-9]\d*$/.test(filtros.departamentoId)) ||
        (filtros.usuarioId && !/^[1-9]\d*$/.test(filtros.usuarioId))) {
      return res.status(400).send('Categoria ou departamento inválido para filtro.');
    }
    if (filtros.prioridade && !prioridades.includes(filtros.prioridade)) {
      return res.status(400).send('Prioridade inválida para filtro.');
    }
    if (req.query.pagina !== undefined &&
        (!/^\d+$/.test(String(req.query.pagina)) || Number(req.query.pagina) < 1)) {
      return res.status(400).send('Número de página inválido.');
    }
    if (filtros.dataInicio && filtros.dataFim && filtros.dataInicio > filtros.dataFim) {
      return res.status(400).send('A data inicial não pode ser posterior à data final.');
    }

    const where = ehAdmin(usuario)
      ? {}
      : ehTecnico(usuario)
        ? { tecnicoId: usuario.id }
        : { usuarioId: usuario.id };

    if (filtros.busca) {
      const termos = [
        { titulo: { [Op.like]: `%${filtros.busca}%` } },
        { descricao: { [Op.like]: `%${filtros.busca}%` } }
      ];
      if (/^\d+$/.test(filtros.busca)) {
        termos.push({ id: Number(filtros.busca) });
      }
      where[Op.and] = [{ [Op.or]: termos }];
    }
    if (filtros.status === 'pendente') {
      where.status = { [Op.notIn]: ['fechado', 'cancelado'] };
    } else if (statusPermitidos.concat('cancelado').includes(filtros.status)) {
      where.status = filtros.status;
    }
    if (/^\d+$/.test(filtros.categoriaId)) {
      where.categoriaChamadoId = Number(filtros.categoriaId);
    }
    if (/^\d+$/.test(filtros.departamentoId)) {
      where.departamentoId = Number(filtros.departamentoId);
    }
    if (prioridades.includes(filtros.prioridade)) {
      where.prioridade = filtros.prioridade;
    }
    if (/^[1-9]\d*$/.test(filtros.usuarioId) && ehAdmin(usuario)) {
      where.usuarioId = Number(filtros.usuarioId);
    }
    if (filtros.dataInicio || filtros.dataFim) {
      const data = {};
      if (dataIsoValida(filtros.dataInicio)) {
        data[Op.gte] = new Date(`${filtros.dataInicio}T00:00:00`);
      }
      if (dataIsoValida(filtros.dataFim)) {
        const fim = new Date(`${filtros.dataFim}T00:00:00`);
        fim.setDate(fim.getDate() + 1);
        data[Op.lt] = fim;
      }
      if (Object.keys(data).length) {
        where.createdAt = data;
      }
    }

    const tamanhoPagina = 10;
    const total = await Chamado.count({ where });
    const paginas = Math.max(1, Math.ceil(total / tamanhoPagina));
    const paginaSolicitada = Number.parseInt(req.query.pagina, 10);
    const pagina = Number.isFinite(paginaSolicitada)
      ? Math.min(Math.max(paginaSolicitada, 1), paginas)
      : 1;
    const [chamados, { categorias, departamentos }, usuarios] = await Promise.all([
      Chamado.findAll({
        where,
        include: [
          { model: Usuario, as: 'solicitante', attributes: ['id', 'nome'] },
          { model: CategoriaChamado, as: 'categoria', attributes: ['id', 'nome'] },
          { model: Departamento, as: 'departamento', attributes: ['id', 'nome'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: tamanhoPagina,
        offset: (pagina - 1) * tamanhoPagina
      }),
      carregarOpcoes(),
      ehAdmin(usuario)
        ? Usuario.findAll({ attributes: ['id', 'nome'], order: [['nome', 'ASC']] })
        : []
    ]);

    res.render('chamados', {
      usuario,
      chamados,
      categorias,
      departamentos,
      usuarios,
      filtros,
      pagina,
      paginas,
      total
    });
  } catch (erro) {
    console.error('Erro ao carregar chamados:', erro);
    res.status(500).send('Erro ao carregar chamados.');
  }
};

exports.novo = async (req, res) => {
  try {
    const opcoes = await carregarOpcoes();
    res.render('novoChamado', { usuario: req.session.usuario, erro: null, ...opcoes });
  } catch (erro) {
    console.error('Erro ao carregar formulário de chamado:', erro);
    res.status(500).send('Erro ao carregar o formulário.');
  }
};

exports.cadastrar = async (req, res) => {
  const body = req.body || {};
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
  const prioridade = body.prioridade;
  const local = typeof body.local === 'string' ? body.local.trim() : '';

  if (!titulo || !descricao) {
    return res.status(400).send('Título e descrição são obrigatórios.');
  }
  if (titulo.length > 150 || descricao.length > 5000) {
    return res.status(400).send('Título ou descrição excedem o limite permitido.');
  }
  if (!prioridades.includes(prioridade)) {
    return res.status(400).send('Selecione uma prioridade válida.');
  }
  if (local.length > 120) {
    return res.status(400).send('O local deve ter no máximo 120 caracteres.');
  }
  const departamentoId = Number(body.departamentoId);
  const categoriaId = Number(body.categoriaChamadoId);
  if (!Number.isInteger(departamentoId) || departamentoId < 1 ||
      !Number.isInteger(categoriaId) || categoriaId < 1) {
    return res.status(400).send('Selecione um departamento e uma categoria de chamado válidos.');
  }

  try {
    const categoria = await CategoriaChamado.findByPk(categoriaId);
    if (!categoria) {
      return res.status(400).send('A categoria de chamado selecionada não existe.');
    }
    if (categoria.departamentoId !== departamentoId) {
      return res.status(400).send('A categoria selecionada não pertence ao departamento informado.');
    }
    const chamado = await Chamado.create({
      titulo,
      descricao,
      prioridade,
      status: 'aberto',
      prazo: calcularPrazo(prioridade),
      local: local || null,
      usuarioId: req.session.usuario.id,
      categoriaChamadoId: categoria.id,
      departamentoId
    });
    await registrarAuditoria(req, {
      acao: 'chamado_criado',
      entidade: 'chamado',
      entidadeId: chamado.id,
      detalhes: {
        titulo,
        prioridade,
        status: 'aberto',
        categoriaChamadoId: categoria.id,
        departamentoId
      }
    });
    await notificacaoEmail.notificarChamado(req, chamado, 'aberto');
    return res.redirect('/chamados');
  } catch (erro) {
    console.error('Erro ao cadastrar chamado:', erro);
    return res.status(500).send('Não foi possível abrir o chamado.');
  }
};

exports.detalhes = async (req, res) => {
  try {
    const chamado = await buscarChamado(req.params.id);
    if (!chamado) {
      return res.status(404).send('Chamado não encontrado.');
    }
    if (!podeAcessar(chamado, req.session.usuario)) {
      return res.status(403).send('Você não tem acesso a este chamado.');
    }

    const comentarios = await Comentario.findAll({
      where: { chamadoId: chamado.id },
      include: [{ model: Usuario, as: 'autor', attributes: ['id', 'nome', 'perfil'] }],
      order: [['data_criacao', 'ASC']]
    });
    const podeGerenciar = ehAdmin(req.session.usuario) ||
      (ehTecnico(req.session.usuario) && chamado.tecnicoId === req.session.usuario.id &&
        chamado.departamentoId === req.session.usuario.departamentoId);
    const [departamentosTransferencia, tecnicosTransferencia] = podeGerenciar
      ? await Promise.all([
        Departamento.findAll({
          attributes: ['id', 'nome'],
          order: [['nome', 'ASC']]
        }),
        Usuario.findAll({
          where: {
            perfil: 'tecnico',
            id: { [Op.ne]: chamado.tecnicoId || 0 }
          },
          attributes: ['id', 'nome', 'departamentoId'],
          order: [['nome', 'ASC']]
        })
      ])
      : [[], []];
    return res.render('detalhesChamado', {
      usuario: req.session.usuario,
      chamado,
      comentarios,
      podeEditar: ehAdmin(req.session.usuario) || ehTecnico(req.session.usuario),
      podeAssumir: ehTecnico(req.session.usuario) &&
        chamado.departamentoId === req.session.usuario.departamentoId &&
        chamado.status === 'aberto' && chamado.tecnicoId === null,
      podeResolver: podeGerenciar && !['fechado', 'cancelado'].includes(chamado.status),
      podeReabrir: podeGerenciar && chamado.status === 'fechado',
      departamentosTransferencia,
      tecnicosTransferencia,
      podeCancelar: chamado.usuarioId === req.session.usuario.id && chamado.status === 'aberto',
      erro: null
    });
  } catch (erro) {
    console.error('Erro ao carregar detalhes do chamado:', erro);
    return res.status(500).send('Erro ao carregar o chamado.');
  }
};

exports.editar = async (req, res) => {
  try {
    const chamado = await buscarChamado(req.params.id);
    if (!chamado) {
      return res.status(404).send('Chamado não encontrado.');
    }
    if (!ehAdmin(req.session.usuario) &&
        (!ehTecnico(req.session.usuario) || !podeAcessar(chamado, req.session.usuario))) {
      return res.status(403).send('Você não tem permissão para editar este chamado.');
    }

    const opcoes = await carregarOpcoes();
    return res.render('editarChamado', {
      usuario: req.session.usuario,
      chamado,
      erro: null,
      ...opcoes
    });
  } catch (erro) {
    console.error('Erro ao abrir edição do chamado:', erro);
    return res.status(500).send('Erro ao carregar a edição do chamado.');
  }
};

exports.atualizar = async (req, res) => {
  try {
    const chamado = await Chamado.findByPk(req.params.id);
    if (!chamado) {
      return res.status(404).send('Chamado não encontrado.');
    }
    const usuario = req.session.usuario;
    if (!ehAdmin(usuario) && (!ehTecnico(usuario) || !podeAcessar(chamado, usuario))) {
      return res.status(403).send('Você não tem permissão para editar este chamado.');
    }

    const titulo = typeof req.body.titulo === 'string' ? req.body.titulo.trim() : '';
    const descricao = typeof req.body.descricao === 'string' ? req.body.descricao.trim() : '';
    const local = typeof req.body.local === 'string' ? req.body.local.trim() : '';
    const prioridade = req.body.prioridade;
    const status = req.body.status;
    if (!titulo || !descricao || titulo.length > 150 || descricao.length > 5000) {
      return res.status(400).send('Preencha título e descrição dentro dos limites permitidos.');
    }
    if (!prioridades.includes(prioridade) || !statusPermitidos.includes(status)) {
      return res.status(400).send('Prioridade ou status inválido.');
    }
    if (local.length > 120) {
      return res.status(400).send('O local deve ter no máximo 120 caracteres.');
    }

    const categoriaId = Number(req.body.categoriaChamadoId);
    if (!Number.isInteger(categoriaId) || categoriaId < 1) {
      return res.status(400).send('Selecione uma categoria de chamado válida.');
    }
    const categoria = await CategoriaChamado.findByPk(categoriaId);
    if (!categoria) {
      return res.status(400).send('A categoria de chamado selecionada não existe.');
    }
    if (ehTecnico(usuario) && categoria.departamentoId !== usuario.departamentoId) {
      return res.status(403).send('Você só pode editar chamados do seu departamento.');
    }

    const atualizacao = {
      titulo,
      descricao,
      prioridade,
      status,
      local: local || null,
      categoriaChamadoId: categoria.id,
      departamentoId: categoria.departamentoId
    };
    if (prioridade !== chamado.prioridade || !chamado.prazo) {
      atualizacao.prazo = calcularPrazo(prioridade);
    }
    if (ehAdmin(usuario)) {
      const tecnicoId = req.body.tecnicoId ? Number(req.body.tecnicoId) : null;
      if (tecnicoId !== null) {
        if (!Number.isInteger(tecnicoId) || tecnicoId < 1) {
          return res.status(400).send('Selecione um técnico válido.');
        }
        const tecnico = await Usuario.findOne({
          where: {
            id: tecnicoId,
            perfil: 'tecnico',
            departamentoId: categoria.departamentoId
          }
        });
        if (!tecnico) {
          return res.status(400).send('Selecione um técnico do departamento da categoria.');
        }
      }
      atualizacao.tecnicoId = tecnicoId;
    } else if (chamado.tecnicoId === null) {
      atualizacao.tecnicoId = usuario.id;
    }

    const antes = {
      titulo: chamado.titulo,
      descricao: chamado.descricao,
      prioridade: chamado.prioridade,
      status: chamado.status,
      local: chamado.local,
      categoriaChamadoId: chamado.categoriaChamadoId,
      departamentoId: chamado.departamentoId,
      tecnicoId: chamado.tecnicoId
    };
    await chamado.update(atualizacao);
    const depois = {
      titulo: chamado.titulo,
      descricao: chamado.descricao,
      prioridade: chamado.prioridade,
      status: chamado.status,
      local: chamado.local,
      categoriaChamadoId: chamado.categoriaChamadoId,
      departamentoId: chamado.departamentoId,
      tecnicoId: chamado.tecnicoId
    };
    await registrarAuditoria(req, {
      acao: antes.tecnicoId !== depois.tecnicoId && depois.tecnicoId
        ? 'chamado_transferido'
        : 'chamado_editado',
      entidade: 'chamado',
      entidadeId: chamado.id,
      transferidoParaId: antes.tecnicoId !== depois.tecnicoId ? depois.tecnicoId : null,
      detalhes: { antes, depois }
    });
    await notificacaoEmail.notificarChamado(
      req,
      chamado,
      antes.tecnicoId !== depois.tecnicoId ? 'atribuido' : 'atualizado'
    );
    return res.redirect(`/chamados/${chamado.id}`);
  } catch (erro) {
    console.error('Erro ao atualizar chamado:', erro);
    return res.status(500).send('Não foi possível atualizar o chamado.');
  }
};

exports.assumir = async (req, res) => {
  if (!ehTecnico(req.session.usuario)) {
    return res.status(403).send('Somente técnicos podem assumir chamados.');
  }
  try {
    const chamado = await Chamado.findByPk(req.params.id);
    if (!chamado) {
      return res.status(404).send('Chamado não encontrado.');
    }
    if (!req.session.usuario.departamentoId ||
        chamado.departamentoId !== req.session.usuario.departamentoId) {
      return res.status(403).send('Você só pode assumir chamados do seu departamento.');
    }
    if (chamado.status !== 'aberto' || chamado.tecnicoId !== null) {
      return res.status(409).send('Este chamado já foi assumido ou não está aberto.');
    }
    const [atualizados] = await Chamado.update(
      { tecnicoId: req.session.usuario.id, status: 'em_andamento' },
      {
        where: {
          id: chamado.id,
          departamentoId: req.session.usuario.departamentoId,
          tecnicoId: null,
          status: 'aberto'
        }
      }
    );
    if (!atualizados) {
      return res.status(409).send('Outro técnico assumiu este chamado primeiro.');
    }
    await registrarAuditoria(req, {
      acao: 'chamado_atribuido',
      entidade: 'chamado',
      entidadeId: chamado.id,
      detalhes: {
        tecnicoAnteriorId: null,
        tecnicoNovoId: req.session.usuario.id,
        statusAnterior: 'aberto',
        statusNovo: 'em_andamento'
      }
    });
    await notificacaoEmail.notificarChamado(req, chamado, 'atribuido');
    return res.redirect(`/chamados/${chamado.id}`);
  } catch (erro) {
    console.error('Erro ao assumir chamado:', erro);
    return res.status(500).send('Não foi possível assumir o chamado.');
  }
};

exports.resolver = async (req, res) => {
  try {
    const chamado = await Chamado.findByPk(req.params.id);
    if (!chamado) return res.status(404).send('Chamado não encontrado.');
    const usuario = req.session.usuario;
    const autorizado = ehAdmin(usuario) ||
      (ehTecnico(usuario) && chamado.tecnicoId === usuario.id &&
        chamado.departamentoId === usuario.departamentoId);
    if (!autorizado) {
      return res.status(403).send('Somente o técnico responsável ou um administrador pode resolver este chamado.');
    }
    if (['fechado', 'cancelado'].includes(chamado.status)) {
      return res.status(409).send('Este chamado já está encerrado.');
    }
    const statusAnterior = chamado.status;
    await chamado.update({ status: 'fechado' });
    await registrarAuditoria(req, {
      acao: 'chamado_resolvido',
      entidade: 'chamado',
      entidadeId: chamado.id,
      detalhes: { statusAnterior, statusNovo: chamado.status }
    });
    await notificacaoEmail.notificarChamado(req, chamado, 'status');
    return res.redirect(`/chamados/${chamado.id}`);
  } catch (erro) {
    console.error('Erro ao resolver chamado:', erro);
    return res.status(500).send('Não foi possível resolver o chamado.');
  }
};

exports.reabrir = async (req, res) => {
  try {
    const chamado = await Chamado.findByPk(req.params.id);
    if (!chamado) return res.status(404).send('Chamado não encontrado.');
    const usuario = req.session.usuario;
    const autorizado = ehAdmin(usuario) ||
      (ehTecnico(usuario) && chamado.tecnicoId === usuario.id &&
        chamado.departamentoId === usuario.departamentoId);
    if (!autorizado) {
      return res.status(403).send('Somente o técnico responsável ou um administrador pode reabrir este chamado.');
    }
    if (chamado.status !== 'fechado') {
      return res.status(409).send('Somente chamados resolvidos podem ser reabertos.');
    }
    const statusAnterior = chamado.status;
    await chamado.update({ status: chamado.tecnicoId ? 'em_andamento' : 'aberto' });
    await registrarAuditoria(req, {
      acao: 'chamado_reaberto',
      entidade: 'chamado',
      entidadeId: chamado.id,
      detalhes: { statusAnterior, statusNovo: chamado.status }
    });
    await notificacaoEmail.notificarChamado(req, chamado, 'status');
    return res.redirect(`/chamados/${chamado.id}`);
  } catch (erro) {
    console.error('Erro ao reabrir chamado:', erro);
    return res.status(500).send('Não foi possível reabrir o chamado.');
  }
};

exports.transferir = async (req, res) => {
  try {
    const chamado = await Chamado.findByPk(req.params.id);
    if (!chamado) return res.status(404).send('Chamado não encontrado.');
    const usuario = req.session.usuario;
    const autorizado = ehAdmin(usuario) ||
      (ehTecnico(usuario) && chamado.tecnicoId === usuario.id &&
        chamado.departamentoId === usuario.departamentoId);
    if (!autorizado) {
      return res.status(403).send('Somente o responsável atual ou um administrador pode transferir este chamado.');
    }
    if (['fechado', 'cancelado'].includes(chamado.status)) {
      return res.status(409).send('Não é possível transferir um chamado encerrado.');
    }
    const departamentoId = Number(req.body.departamentoId);
    const tecnicoId = Number(req.body.tecnicoId);
    if (![departamentoId, tecnicoId].every(id => Number.isInteger(id) && id > 0)) {
      return res.status(400).send('Selecione um departamento e um técnico válidos.');
    }
    const tecnico = await Usuario.findOne({
      where: {
        id: tecnicoId,
        perfil: 'tecnico',
        departamentoId
      }
    });
    if (!tecnico) {
      return res.status(400).send('O técnico selecionado não pertence ao departamento informado.');
    }
    if (tecnico.id === chamado.tecnicoId) {
      return res.status(400).send('Selecione um técnico diferente do responsável atual.');
    }
    const dadosAnteriores = {
      departamentoId: chamado.departamentoId,
      categoriaChamadoId: chamado.categoriaChamadoId,
      tecnicoId: chamado.tecnicoId,
      status: chamado.status
    };
    await chamado.update({
      departamentoId,
      categoriaChamadoId: departamentoId === Number(chamado.departamentoId)
        ? chamado.categoriaChamadoId
        : null,
      tecnicoId: tecnico.id,
      status: 'em_andamento'
    });
    await registrarAuditoria(req, {
      acao: 'chamado_transferido',
      entidade: 'chamado',
      entidadeId: chamado.id,
      transferidoParaId: tecnico.id,
      detalhes: {
        titulo: chamado.titulo,
        departamentoAnteriorId: dadosAnteriores.departamentoId,
        departamentoNovoId: departamentoId,
        categoriaAnteriorId: dadosAnteriores.categoriaChamadoId,
        categoriaNovaId: chamado.categoriaChamadoId,
        tecnicoAnteriorId: dadosAnteriores.tecnicoId,
        tecnicoNovoId: tecnico.id,
        statusAnterior: dadosAnteriores.status,
        statusNovo: chamado.status
      }
    });
    await notificacaoEmail.notificarChamado(req, chamado, 'atribuido');
    return res.redirect(`/chamados/${chamado.id}`);
  } catch (erro) {
    console.error('Erro ao transferir chamado:', erro);
    return res.status(500).send('Não foi possível transferir o chamado.');
  }
};

exports.comentar = async (req, res) => {
  const texto = typeof req.body.texto === 'string' ? req.body.texto.trim() : '';
  if (!texto || texto.length > 2000) {
    return res.status(400).send('O comentário deve conter de 1 a 2.000 caracteres.');
  }
  try {
    const chamado = await buscarChamado(req.params.id);
    if (!chamado) {
      return res.status(404).send('Chamado não encontrado.');
    }
    if (!podeAcessar(chamado, req.session.usuario)) {
      return res.status(403).send('Você não tem acesso a este chamado.');
    }
    const comentario = await Comentario.create({
      texto,
      chamadoId: chamado.id,
      usuarioId: req.session.usuario.id
    });
    await chamado.update({ updatedAt: new Date() });
    await registrarAuditoria(req, {
      acao: 'mensagem_chamado_enviada',
      entidade: 'chamado',
      entidadeId: chamado.id,
      detalhes: { comentarioId: comentario.id, autorId: req.session.usuario.id }
    });
    await notificacaoEmail.notificarChamado(req, chamado, 'mensagem');
    return res.redirect(`/chamados/${chamado.id}`);
  } catch (erro) {
    console.error('Erro ao adicionar comentário:', erro);
    return res.status(500).send('Não foi possível adicionar o comentário.');
  }
};

exports.atualizarEtiquetas = async (req, res) => {
  try {
    const chamado = await buscarChamado(req.params.id);
    if (!chamado) {
      return res.status(404).send('Chamado não encontrado.');
    }
    if (!ehAdmin(req.session.usuario) &&
        (!ehTecnico(req.session.usuario) || !podeAcessar(chamado, req.session.usuario))) {
      return res.status(403).send('Você não tem permissão para alterar as etiquetas.');
    }

    const nomes = typeof req.body.etiquetas === 'string'
      ? Array.from(new Set(req.body.etiquetas.split(',').map((nome) => nome.trim()).filter(Boolean)))
      : [];
    if (nomes.some((nome) => nome.length > 40) || nomes.length > 10) {
      return res.status(400).send('Use até 10 etiquetas com no máximo 40 caracteres cada.');
    }

    const etiquetas = [];
    for (const nome of nomes) {
      const [etiqueta] = await Etiqueta.findOrCreate({ where: { nome } });
      etiquetas.push(etiqueta);
    }
    const etiquetasAnteriores = chamado.etiquetas.map(etiqueta => etiqueta.nome);
    await chamado.setEtiquetas(etiquetas);
    await registrarAuditoria(req, {
      acao: 'etiquetas_chamado_alteradas',
      entidade: 'chamado',
      entidadeId: chamado.id,
      detalhes: { antes: etiquetasAnteriores, depois: nomes }
    });
    await notificacaoEmail.notificarChamado(req, chamado, 'atualizado');
    return res.redirect(`/chamados/${chamado.id}`);
  } catch (erro) {
    console.error('Erro ao atualizar etiquetas:', erro);
    return res.status(500).send('Não foi possível atualizar as etiquetas.');
  }
};

exports.cancelar = async (req, res) => {
  try {
    const chamado = await Chamado.findByPk(req.params.id);
    if (!chamado) {
      return res.status(404).send('Chamado não encontrado.');
    }
    if (chamado.usuarioId !== req.session.usuario.id || chamado.status !== 'aberto') {
      return res.status(403).send('Só é possível cancelar seus próprios chamados ainda abertos.');
    }
    await chamado.update({ status: 'cancelado' });
    await registrarAuditoria(req, {
      acao: 'chamado_cancelado',
      entidade: 'chamado',
      entidadeId: chamado.id,
      detalhes: { statusAnterior: 'aberto', statusNovo: 'cancelado' }
    });
    await notificacaoEmail.notificarChamado(req, chamado, 'status');
    return res.redirect(`/chamados/${chamado.id}`);
  } catch (erro) {
    console.error('Erro ao cancelar chamado:', erro);
    return res.status(500).send('Não foi possível cancelar o chamado.');
  }
};

exports.excluir = async (req, res) => {
  if (!ehAdmin(req.session.usuario)) {
    return res.status(403).send('Somente administradores podem excluir chamados.');
  }
  let transacao;
  try {
    transacao = await Chamado.sequelize.transaction();
    const chamado = await Chamado.findByPk(req.params.id, { transaction: transacao });
    if (!chamado) {
      await transacao.rollback();
      return res.status(404).send('Chamado não encontrado.');
    }
    await Comentario.destroy({ where: { chamadoId: chamado.id }, transaction: transacao });
    await ChamadoEtiqueta.destroy({ where: { chamadoId: chamado.id }, transaction: transacao });
    const detalhes = {
      titulo: chamado.titulo,
      usuarioId: chamado.usuarioId,
      tecnicoId: chamado.tecnicoId,
      departamentoId: chamado.departamentoId,
      status: chamado.status
    };
    await chamado.destroy({ transaction: transacao });
    await registrarAuditoria(req, {
      acao: 'chamado_excluido',
      entidade: 'chamado',
      entidadeId: chamado.id,
      detalhes
    }, transacao);
    await transacao.commit();
    return res.redirect('/chamados');
  } catch (erro) {
    if (transacao && !transacao.finished) {
      await transacao.rollback();
    }
    console.error('Erro ao excluir chamado:', erro);
    return res.status(500).send('Não foi possível excluir o chamado.');
  }
};
