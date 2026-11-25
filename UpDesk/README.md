# UpDesk — Sistema de gerenciamento de chamados

Aplicação web para registrar, organizar e acompanhar solicitações de suporte técnico.

**Acesso público:** [https://updesk-nru0.onrender.com](https://updesk-nru0.onrender.com)

**Disciplina:** Programação Backend — Sistemas de Informação, UNIVAS
**Professor:** Raffael Carvalho

## Funcionalidades

- Cadastro, login e logout; senhas armazenadas com hash.
- Perfis de administrador, técnico e cliente, com autorização no backend.
- Abertura, consulta, atualização e cancelamento de chamados.
- Organização por departamentos e categorias de chamados.
- Atribuição e transferência de chamados entre departamentos e técnicos.
- Comentários no chamado e chat entre integrantes da equipe técnica.
- Filtros e paginação na lista de chamados.
- Prazos calculados conforme a prioridade, considerando dias úteis, e indicação de atrasos.
- Dashboard com indicadores e gráficos; impressão pelo navegador para salvar relatórios em PDF.
- Administração de usuários, departamentos e categorias; administradores podem editar nome, e-mail, perfil e departamento dos usuários, além de redefinir a senha opcionalmente.
- Logs de auditoria registram alterações e operações relevantes com autor, data, registro e detalhes. Administradores consultam todo o histórico, com paginação; técnicos veem apenas transferências recebidas por eles.
- Notificações por e-mail somente ao cliente do chamado e ao técnico atualmente atribuído: abertura, atribuição/transferência, atualizações, mudanças de status e mensagens. Administradores não recebem cópias.

## Perfis de acesso

| Perfil | Acesso principal |
|---|---|
| Administrador | Gerencia usuários, departamentos e categorias; acompanha e administra os chamados. |
| Técnico | Trabalha na fila e nos chamados atribuídos ao seu departamento; pode conversar com a equipe. |
| Cliente | Abre chamados e acompanha os próprios atendimentos. |

## Tecnologias

Node.js, Express, EJS, Sequelize, MySQL, `express-session` e `bcryptjs`.

## Estrutura do projeto

```text
app.js                 Inicialização do servidor e registro das rotas
src/
  config/              Banco de dados, configuração inicial e migrações
  controllers/         Regras de negócio e tratamento das requisições
  middlewares/         Autenticação e autorização
  models/              Modelos Sequelize e associações
  public/              CSS e JavaScript do navegador
  routes/              Rotas Express
  utils/               Funções auxiliares
  views/               Páginas EJS e componentes compartilhados
test/                  Testes automatizados
archive/               Snapshot legado, fora da execução da aplicação
```

## Executar localmente

Requisitos: Node.js e acesso a um banco MySQL com conexão SSL habilitada.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha as configurações:

   | Variável | Uso |
   |---|---|
   | `DB_HOST`, `DB_PORT` | Endereço e porta do MySQL (`3306` por padrão). |
   | `DB_NOME`, `DB_USUARIO`, `DB_SENHA` | Banco e credenciais. |
   | `SESSION_SECRET` | Segredo da sessão; obrigatório em produção. |
   | `ADMIN_EMAIL`, `ADMIN_SENHA` | Criam o primeiro administrador quando ainda não existe um. |
   | `ADMIN_NOME` | Nome opcional do administrador inicial. |
   | `PORT` | Porta HTTP; o padrão local é `3000`. |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Servidor SMTP; use `true` em conexão TLS implícita, normalmente na porta `465`. |
   | `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Credenciais SMTP e endereço remetente (`SMTP_FROM` pode usar o usuário SMTP). |
   | `APP_URL` | URL pública usada nos links dos e-mails. |

   Não inclua credenciais ou segredos no Git.

3. Inicie o servidor:

   ```bash
   node app.js
   ```

   Na inicialização, o Sequelize sincroniza os modelos e executa as tarefas de migração do projeto.

O cadastro público cria contas de cliente. O administrador inicial pode criar contas de técnico pela área de usuários.

## Testes

Execute a suíte automatizada com:

```bash
npm test
```

Os 24 testes automatizados cobrem autorização, prazos, validações, transferência de chamados, edição de usuários, auditoria e destinatários das notificações. Eles não substituem a validação da aplicação publicada nem um teste com o SMTP de produção.

## Produção

- **Aplicação:** [Render — UpDesk](https://updesk-nru0.onrender.com)
- **Banco de dados:** MySQL hospedado no Aiven

No Render, configure as variáveis de banco, `SESSION_SECRET` e as credenciais SMTP para ativar os e-mails. Configure também `APP_URL` com a URL pública. Se for a primeira inicialização sem administrador, informe `ADMIN_EMAIL` e `ADMIN_SENHA`. O serviço fornece a variável `PORT`. Mantenha os segredos nas configurações do serviço, nunca no repositório.

## Release 4 — Versão final

| Funcionalidade adicional | Pontos |
|---|---:|
| Layout responsivo para celular | 1 |
| Dashboard com gráficos | 2 |
| Impressão de relatórios em PDF pelo navegador | 1 |
| Notificações por e-mail | 2 |
| Logs de auditoria | 2 |
| **Total** | **8 de 8** |

- **Testes automatizados:** 24 testes aprovados com `npm test`.
- **Versão publicada:** [https://updesk-nru0.onrender.com](https://updesk-nru0.onrender.com).
- **Criação de contas para demonstração:** configure o administrador inicial com `ADMIN_EMAIL` e `ADMIN_SENHA`; clientes podem se cadastrar e o administrador pode criar contas de técnico. Não inclua senhas de teste neste README.

## Equipe

| Integrante | Responsabilidade principal |
|---|---|
| Leandra | Produto e organização dos requisitos |
| Karem | Interface e experiência do usuário |
| Gabriela | Backend, rotas e autenticação |
| João Pedro Alvarenga | Banco de dados e integração |

## Uso de IA

A IA foi usada como apoio na programação e na documentação. A equipe revisou as alterações e é responsável pelo projeto.
