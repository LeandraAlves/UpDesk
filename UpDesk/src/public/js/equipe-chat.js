(function () {
  const chat = document.querySelector('[data-equipe-chat]');
  if (!chat) return;

  const historico = document.getElementById('team-chat-history');
  const formulario = chat.querySelector('.team-chat-form');
  const campo = formulario.querySelector('textarea[name="texto"]');
  const botao = formulario.querySelector('button[type="submit"]');
  const aviso = chat.querySelector('[data-chat-error]');
  const mensagensUrl = chat.dataset.mensagensUrl;
  const usuarioId = Number(chat.dataset.usuarioId);
  let ultimaMensagemId = 0;
  let carregando = false;

  function mostrarErro(texto) {
    aviso.textContent = texto;
    aviso.hidden = !texto;
  }

  function adicionarMensagem(mensagem) {
    if (mensagem.id <= ultimaMensagemId) return;
    ultimaMensagemId = mensagem.id;

    const item = document.createElement('article');
    item.className = 'comment-item';

    const avatar = document.createElement('div');
    avatar.className = 'comment-avatar';
    avatar.textContent = mensagem.autor.nome.charAt(0).toUpperCase();

    const corpo = document.createElement('div');
    corpo.className = 'comment-body';
    const meta = document.createElement('div');
    meta.className = 'comment-meta';
    const autor = document.createElement('strong');
    autor.textContent = mensagem.autor.id === usuarioId ? 'Você' : mensagem.autor.nome;
    const data = document.createElement('time');
    data.dateTime = mensagem.data;
    data.textContent = new Date(mensagem.data).toLocaleString('pt-BR');
    const texto = document.createElement('p');
    texto.textContent = mensagem.texto;

    meta.append(autor, data);
    corpo.append(meta, texto);
    item.append(avatar, corpo);
    historico.appendChild(item);
    historico.scrollTop = historico.scrollHeight;
  }

  async function carregarMensagens() {
    if (carregando || document.hidden) return;
    carregando = true;
    const separador = mensagensUrl.includes('?') ? '&' : '?';
    const url = ultimaMensagemId
      ? `${mensagensUrl}${separador}after=${ultimaMensagemId}`
      : mensagensUrl;
    try {
      const resposta = await fetch(url, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.erro || 'Não foi possível carregar as mensagens.');
      resultado.mensagens.forEach(adicionarMensagem);
      mostrarErro('');
    } catch (erro) {
      console.error('Falha ao carregar o chat da equipe:', erro);
      mostrarErro(erro.message || 'Falha ao carregar as mensagens.');
    } finally {
      carregando = false;
    }
  }

  formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;
    botao.disabled = true;
    mostrarErro('');
    try {
      const resposta = await fetch(formulario.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ texto }),
        credentials: 'same-origin'
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.erro || 'Não foi possível enviar a mensagem.');
      adicionarMensagem(resultado.mensagem);
      campo.value = '';
      campo.focus();
    } catch (erro) {
      console.error('Falha ao enviar mensagem à equipe:', erro);
      mostrarErro(erro.message || 'Falha ao enviar a mensagem.');
    } finally {
      botao.disabled = false;
    }
  });

  carregarMensagens();
  window.setInterval(carregarMensagens, 4000);
}());
