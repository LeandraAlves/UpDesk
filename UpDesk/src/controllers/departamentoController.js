const Departamento = require('../models/Departamento');
const Chamado = require('../models/Chamado');
const Usuario = require('../models/Usuario');
const CategoriaChamado = require('../models/CategoriaChamado');
const registrarAuditoria = require('../utils/registrarAuditoria');

const TAMANHO_MAXIMO = 255;

function textoDoCampo(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function idValido(valor) {
  return /^\d+$/.test(valor) && Number.isSafeInteger(Number(valor)) && Number(valor) > 0;
}

async function renderizarPagina(req, res, opcoes) {
  const departamentos = await Departamento.findAll({ order: [['nome', 'ASC']] });
  return res.status(opcoes.status || 200).render('departamentos/index', {
    usuario: req.session.usuario,
    departamentos,
    erro: opcoes.erro || '',
    sucesso: req.query.sucesso || '',
    formulario: opcoes.formulario || { nome: '', descricao: '' }
  });
}

function erroDeUnicidade(erro) {
  return erro && erro.name === 'SequelizeUniqueConstraintError';
}

exports.gerenciar = async (req, res) => {
  try {
    return await renderizarPagina(req, res, {});
  } catch (erro) {
    console.error('Erro ao carregar departamentos:', erro);
    return res.status(500).send('Não foi possível carregar os departamentos.');
  }
};

exports.cadastrar = async (req, res) => {
  const formulario = {
    nome: textoDoCampo(req.body && req.body.nome),
    descricao: textoDoCampo(req.body && req.body.descricao)
  };

  if (!formulario.nome) {
    return renderizarPagina(req, res, {
      status: 400,
      erro: 'Informe o nome do departamento.',
      formulario
    });
  }

  if (formulario.nome.length > TAMANHO_MAXIMO || formulario.descricao.length > TAMANHO_MAXIMO) {
    return renderizarPagina(req, res, {
      status: 400,
      erro: 'O nome e a descrição devem ter no máximo 255 caracteres.',
      formulario
    });
  }

  try {
    const existente = await Departamento.findOne({ where: { nome: formulario.nome } });
    if (existente) {
      return renderizarPagina(req, res, {
        status: 409,
        erro: 'Já existe um departamento com esse nome.',
        formulario
      });
    }

    const departamento = await Departamento.create({
      nome: formulario.nome,
      descricao: formulario.descricao || null
    });
    await registrarAuditoria(req, {
      acao: 'departamento_criado',
      entidade: 'departamento',
      entidadeId: departamento.id,
      detalhes: { nome: departamento.nome, descricao: departamento.descricao }
    });
    return res.redirect('/departamentos?sucesso=criado');
  } catch (erro) {
    if (erroDeUnicidade(erro)) {
      return renderizarPagina(req, res, {
        status: 409,
        erro: 'Já existe um departamento com esse nome.',
        formulario
      });
    }
    console.error('Erro ao cadastrar departamento:', erro);
    return renderizarPagina(req, res, {
      status: 500,
      erro: 'Não foi possível cadastrar o departamento.',
      formulario
    });
  }
};

exports.editar = async (req, res) => {
  const formulario = {
    nome: textoDoCampo(req.body && req.body.nome),
    descricao: textoDoCampo(req.body && req.body.descricao)
  };

  if (!idValido(req.params.id)) {
    return renderizarPagina(req, res, {
      status: 400,
      erro: 'O identificador do departamento é inválido.',
      formulario
    });
  }
  if (!formulario.nome) {
    return renderizarPagina(req, res, {
      status: 400,
      erro: 'Informe o nome do departamento.',
      formulario
    });
  }
  if (formulario.nome.length > TAMANHO_MAXIMO || formulario.descricao.length > TAMANHO_MAXIMO) {
    return renderizarPagina(req, res, {
      status: 400,
      erro: 'O nome e a descrição devem ter no máximo 255 caracteres.',
      formulario
    });
  }

  try {
    const departamento = await Departamento.findByPk(Number(req.params.id));
    if (!departamento) {
      return renderizarPagina(req, res, {
        status: 404,
        erro: 'Departamento não encontrado.',
        formulario
      });
    }

    const existente = await Departamento.findOne({
      where: { nome: formulario.nome }
    });
    if (existente && existente.id !== departamento.id) {
      return renderizarPagina(req, res, {
        status: 409,
        erro: 'Já existe um departamento com esse nome.',
        formulario
      });
    }

    const antes = { nome: departamento.nome, descricao: departamento.descricao };
    await departamento.update({
      nome: formulario.nome,
      descricao: formulario.descricao || null
    });
    await registrarAuditoria(req, {
      acao: 'departamento_editado',
      entidade: 'departamento',
      entidadeId: departamento.id,
      detalhes: {
        antes,
        depois: { nome: departamento.nome, descricao: departamento.descricao }
      }
    });
    return res.redirect('/departamentos?sucesso=editado');
  } catch (erro) {
    if (erroDeUnicidade(erro)) {
      return renderizarPagina(req, res, {
        status: 409,
        erro: 'Já existe um departamento com esse nome.',
        formulario
      });
    }
    console.error('Erro ao editar departamento:', erro);
    return renderizarPagina(req, res, {
      status: 500,
      erro: 'Não foi possível editar o departamento.',
      formulario
    });
  }
};

exports.excluir = async (req, res) => {
  if (!idValido(req.params.id)) {
    return renderizarPagina(req, res, {
      status: 400,
      erro: 'O identificador do departamento é inválido.'
    });
  }

  try {
    const resultado = await Departamento.sequelize.transaction(async (transaction) => {
      const departamento = await Departamento.findByPk(Number(req.params.id), { transaction });
      if (!departamento) {
        return { status: 404, erro: 'Departamento não encontrado.' };
      }

      const [chamados, usuarios, categorias] = await Promise.all([
        Chamado.count({
          where: { departamentoId: departamento.id },
          transaction
        }),
        Usuario.count({
          where: { departamentoId: departamento.id },
          transaction
        }),
        CategoriaChamado.count({
          where: { departamentoId: departamento.id },
          transaction
        })
      ]);

      if (chamados || usuarios) {
        const vinculacoes = [];
        if (chamados) vinculacoes.push(`${chamados} chamado(s)`);
        if (usuarios) vinculacoes.push(`${usuarios} usuário(s)`);
        if (categorias) vinculacoes.push(`${categorias} categoria(s) de chamado`);
        return {
          status: 409,
          erro: `Não é possível excluir este departamento: há ${vinculacoes.join(' e ')} associado(s).`
        };
      }

      const dadosDepartamento = {
        id: departamento.id,
        nome: departamento.nome,
        descricao: departamento.descricao
      };
      await departamento.destroy({ transaction });
      await registrarAuditoria(req, {
        acao: 'departamento_excluido',
        entidade: 'departamento',
        entidadeId: dadosDepartamento.id,
        detalhes: dadosDepartamento
      }, transaction);
      return { status: 200 };
    });

    if (resultado.erro) {
      return renderizarPagina(req, res, resultado);
    }
    return res.redirect('/departamentos?sucesso=excluido');
  } catch (erro) {
    if (erro && erro.name === 'SequelizeForeignKeyConstraintError') {
      return renderizarPagina(req, res, {
        status: 409,
        erro: 'Não é possível excluir este departamento porque há registros associados.'
      });
    }
    console.error('Erro ao excluir departamento:', erro);
    return renderizarPagina(req, res, {
      status: 500,
      erro: 'Não foi possível excluir o departamento.'
    });
  }
};
