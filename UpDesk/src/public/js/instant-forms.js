(function () {
  async function renderizarResposta(response, updateHistory) {
    const html = await response.text();
    const documento = new DOMParser().parseFromString(html, 'text/html');
    const novoLayout = documento.querySelector('.app-layout');
    const layoutAtual = document.querySelector('.app-layout');

    if (!novoLayout || !layoutAtual) {
      if (response.redirected) {
        window.location.assign(response.url);
        return;
      }
      const area = document.querySelector('.content-area');
      if (area) {
        const aviso = document.createElement('div');
        aviso.className = 'alert-error';
        aviso.setAttribute('role', 'alert');
        aviso.dataset.instantMessage = 'true';
        aviso.textContent = documento.body.textContent.trim() || 'Não foi possível concluir a operação.';
        area.prepend(aviso);
      }
      return;
    }

    layoutAtual.replaceWith(novoLayout);
    document.title = documento.title;
    const scriptsNovos = Array.from(documento.querySelectorAll('script:not([src])'));
    const scriptsAtuais = Array.from(document.querySelectorAll('script:not([src])'));
    function executarScript(script) {
      const novo = document.createElement('script');
      Array.from(script.attributes).forEach((atributo) => novo.setAttribute(atributo.name, atributo.value));
      novo.textContent = script.textContent;
      return novo;
    }
    scriptsAtuais.forEach((script, indice) => {
      if (scriptsNovos[indice]) {
        script.replaceWith(executarScript(scriptsNovos[indice]));
      } else {
        script.remove();
      }
    });
    scriptsNovos.slice(scriptsAtuais.length).forEach((script) => {
      document.body.appendChild(executarScript(script));
    });
    if (updateHistory && response.url) {
      const url = new URL(response.url);
      window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }

  document.addEventListener('submit', async function (event) {
    if (event.defaultPrevented) return;
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.method.toLowerCase() !== 'post' ||
        form.dataset.nativeSubmit === 'true') {
      return;
    }
    event.preventDefault();
    const botao = event.submitter;
    if (botao) botao.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new URLSearchParams(new FormData(form)),
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin'
      });
      if (!response.ok) {
        const texto = await response.text();
        const area = document.querySelector('.content-area');
        const aviso = document.createElement('div');
        aviso.className = 'alert-error';
        aviso.setAttribute('role', 'alert');
        aviso.textContent = texto.trim() || 'Não foi possível concluir a operação.';
        if (area) area.prepend(aviso);
        return;
      }
      await renderizarResposta(response, true);
    } catch (erro) {
      console.error('Falha ao atualizar a tela sem recarregar:', erro);
      const area = document.querySelector('.content-area');
      if (area) {
        const aviso = document.createElement('div');
        aviso.className = 'alert-error';
        aviso.setAttribute('role', 'alert');
        aviso.textContent = 'Falha de comunicação. Tente novamente.';
        area.prepend(aviso);
      }
    } finally {
      if (botao && document.contains(botao)) botao.disabled = false;
    }
  });

  window.addEventListener('popstate', async function () {
    try {
      const response = await fetch(window.location.href, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Falha ao restaurar página (${response.status}).`);
      await renderizarResposta(response, false);
    } catch (erro) {
      console.error('Falha ao restaurar a página:', erro);
      window.location.reload();
    }
  });
}());
