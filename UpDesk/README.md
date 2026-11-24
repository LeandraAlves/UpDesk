# UpDesk — Sistema de gerenciamento de chamados

**Disciplina:** Programação Backend  
**Curso:** Sistemas de Informação — UNIVAS  
**Professor:** Raffael Carvalho  
**Entrega:** Release 3 — Funcionalidades

> **Status:** Requisitos funcionais da Release 3 implementados. Confirmar commits de todos os integrantes; deploy permanece fora do escopo atual.

## 1. Equipe e papéis

| Integrante | Papel | Responsabilidades |
|---|---|---|
| Leandra | Product Owner | Organizar requisitos, backlog, prioridades e acompanhar entregas |
| Karem | Frontend | Desenvolver telas, navegação e experiência do usuário |
| Gabriela | Backend | Implementar rotas, controllers, autenticação e regras de negócio |
| João Pedro Alvarenga | Banco de Dados e Integração/Deploy | Modelar dados, configurar MySQL/Sequelize, integrar, testar e publicar |

Todos os integrantes deverão contribuir com commits e compreender o funcionamento do sistema.

## 2. Problema, público-alvo e solução

**Problema:** solicitações de suporte técnico feitas por mensagens, e-mails ou verbalmente podem se perder e dificultar a identificação de responsáveis, prioridades e prazos.

**Público-alvo:** pequenas e médias empresas com equipes internas de suporte, especialmente de TI.

**Solução proposta:** uma aplicação web centralizada para registrar, classificar, acompanhar e resolver chamados, mantendo histórico de atendimento e indicadores.

**Objetivo:** melhorar a organização e a rastreabilidade das solicitações de suporte técnico.

## 3. Backlog — histórias de usuário

| ID | História de usuário | Prioridade |
|---|---|---|
| HU01 | Como funcionário, quero criar uma conta para solicitar e acompanhar suporte. | Alta |
| HU02 | Como usuário, quero fazer login e logout para proteger minhas informações e sessões. | Alta |
| HU03 | Como funcionário, quero abrir chamados para receber ajuda com problemas técnicos. | Alta |
| HU04 | Como funcionário, quero acompanhar o status dos meus chamados para me planejar enquanto aguardo o atendimento. | Alta |
| HU05 | Como técnico, quero visualizar chamados pendentes para priorizar o trabalho da equipe. | Alta |
| HU06 | Como técnico, quero atualizar o status e registrar a solução de um chamado para informar o andamento e documentar a resolução. | Alta |
| HU07 | Como administrador, quero gerenciar categorias e departamentos para padronizar a classificação das solicitações. | Alta |
| HU08 | Como usuário, quero comentar em chamados para esclarecer dúvidas durante o atendimento. | Média |
| HU09 | Como administrador, quero consultar gráficos para identificar volumes e atrasos no suporte. | Média |
| HU10 | Como usuário, quero pesquisar e filtrar chamados para localizar solicitações sem percorrer toda a lista. | Média |
| HU11 | Como administrador, quero exportar relatórios para compartilhar indicadores com a gestão. | Média |
| HU12 | Como usuário, quero receber notificações de alterações para saber quando houver novidades no atendimento. | Média |

## 4. Checklist dos requisitos obrigatórios

- [x] **8 telas distintas:** Login, Cadastro, Dashboard, Chamados, Novo Chamado, Detalhes/Edição, Categorias e Departamentos.
- [x] **5 entidades de negócio além de Usuário:** Chamado, Categoria, Departamento, Comentário e Etiqueta.
- [x] **CRUDs obrigatórios:** Chamados (abrir, listar, editar e cancelar/excluir conforme perfil), Categorias e Departamentos (criar, listar, editar e excluir com proteção de dependências).
- [x] **Relacionamento 1:N:** Departamento → Chamados.
- [x] **Relacionamento N:N:** Chamados ↔ Etiquetas, com tabela intermediária.
- [x] **Regra de negócio:** prazo calculado conforme prioridade (alta: 1 dia útil; média: 3 dias úteis; baixa: 5 dias úteis), com alerta de atraso.
- [x] **Busca/filtro e paginação:** na listagem de chamados.
- [x] **Autenticação:** cadastro, login e logout; senhas armazenadas com hash.
- [x] **Autorização:** perfis de administrador, técnico e cliente validados no backend. O administrador gerencia o sistema; técnicos acessam a fila e os chamados atribuídos; clientes abrem e acompanham seus próprios chamados.
- [x] **Proteção:** telas e endpoints privados acessíveis somente após autenticação.
- [x] **Validação:** validação no backend com mensagens claras.
- [x] **Boas práticas:** Sequelize (ORM), variáveis de ambiente em `.env` fora do Git e consultas seguras.
- [ ] **Git:** repositório, README, commits de todos os membros.
- [ ] **Deploy:** aplicação publicada em URL pública.

## 5. Extras selecionados — mínimo de 8 pontos

| Funcionalidade | Pontos |
|---|---:|
| Layout responsivo para celular | 1 (implementado) |
| Dashboard com gráficos | 2 (implementado) |
| Exportação do dashboard e chamados em PDF via impressão do navegador | 1 (implementado) |
| Testes automatizados (19 testes) | 2 (implementado) |
| Notificações por e-mail | 2 (pendente) |
| Log de auditoria de alterações | 2 (pendente) |
| **Total implementado** | **6 de 8** |

> A pontuação só será obtida se os extras estiverem funcionando na demonstração final.

## 6. Tecnologias e justificativas

| Tecnologia | Justificativa |
|---|---|
| HTML5, CSS3 e JavaScript | Estrutura, estilo e interatividade das telas |
| Node.js | Execução do backend em JavaScript, conforme estudado na disciplina |
| Express | Rotas HTTP e middlewares |
| EJS | Renderização de páginas dinâmicas |
| MySQL | Persistência dos dados relacionais |
| Sequelize | Models, relacionamentos e operações de banco com ORM |
| Arquitetura MVC | Separação entre Model, View e Controller |
| Git e GitHub | Versionamento e colaboração |

### Executar localmente

1. Instale as dependências com `npm install` e crie um banco MySQL (por padrão, `updesk_db`).
2. Configure `DB_HOST`, `DB_NOME`, `DB_USUARIO`, `DB_SENHA` e `SESSION_SECRET`. Na primeira inicialização, informe também `ADMIN_EMAIL` e `ADMIN_SENHA` para criar o administrador inicial (opcionalmente, `ADMIN_NOME`). Não coloque credenciais no Git; em produção, `SESSION_SECRET` é obrigatório.
3. Inicie o servidor com `node app.js`. O Sequelize sincroniza os modelos antes de iniciar o servidor.

Os modelos e associações ficam em `src/models`; tabelas e chaves são sincronizadas pelo Sequelize na inicialização.

## 7. Esboço das telas

| Tela | Elementos planejados |
|---|---|
| 1. Login | E-mail, senha e link para cadastro |
| 2. Cadastro | Nome, e-mail, senha e confirmação |
| 3. Dashboard | Indicadores e gráficos dos chamados |
| 4. Chamados | Tabela com pesquisa, filtros, paginação e ações |
| 5. Novo Chamado | Título, descrição, categoria e prioridade |
| 6. Detalhes/Edição | Dados do chamado, comentários, responsável e status |
| 7. Categorias | Listagem e formulários de cadastro/edição/exclusão |
| 8. Departamentos | Listagem e formulários de cadastro/edição/exclusão |

**Esboço inicial das oito telas (rascunho em preto e branco):**

![Esboço inicial das 8 telas do UpDesk](esboco_8_telas.png.png)

*Figura 1 — Wireframes preliminares do UpDesk, feitos com aparência de desenho no papel. O desenho é conceitual e pode ser refinado durante o desenvolvimento.*

## 8. Modelo de dados — DER inicial

| Entidade | Campos principais |
|---|---|
| Usuario | id, nome, email, senha_hash, perfil, tipo_usuario_id, departamento_id |
| Departamento | id, nome, descricao |
| TipoUsuario | id, nome, descricao |
| CategoriaChamado | id, nome, descricao, departamento_id |
| Chamado | id, titulo, descricao, status, prioridade, prazo, usuario_id, departamento_id, categoria_chamado_id, tecnico_id |
| Comentario | id, texto, chamado_id, usuario_id, data_criacao |
| Etiqueta | id, nome |
| Chamado_Etiqueta | chamado_id, etiqueta_id (associação N:N) |

**Relacionamentos previstos:** Departamento 1:N Chamado e CategoriaChamado; CategoriaChamado 1:N Chamado; TipoUsuario 1:N Usuario; Usuário 1:N Chamado; Chamado 1:N Comentário; Chamado N:N Etiqueta via Chamado_Etiqueta.

### Diagrama conceitual preliminar

```mermaid
erDiagram
    USUARIO ||--o{ CHAMADO : abre
    USUARIO ||--o{ COMENTARIO : escreve
    DEPARTAMENTO ||--o{ CHAMADO : recebe
    CATEGORIA_CHAMADO ||--o{ CHAMADO : classifica
    CHAMADO ||--o{ COMENTARIO : possui
    CHAMADO ||--o{ CHAMADO_ETIQUETA : possui
    ETIQUETA ||--o{ CHAMADO_ETIQUETA : identifica
```

> DER conceitual preliminar, sujeito a ajustes. Os campos e chaves principais estão na tabela anterior; `tecnico_id` referencia um usuário responsável pelo atendimento.

## Ajustes de atendimento

- Categorias de chamados são independentes dos tipos de usuário e sempre pertencem a um departamento.
- Na abertura de um chamado, o departamento é selecionado antes da categoria e limita as categorias disponíveis. O administrador também pode filtrar categorias por departamento.
- Chamados podem ser filtrados por texto, status, categoria, departamento, gravidade e solicitante. Os itens do dashboard levam à listagem com o filtro correspondente.
- Técnicos veem na fila somente chamados não atribuídos do próprio departamento, podem transferir chamados atribuídos a outros técnicos do mesmo departamento e marcar chamados como resolvidos.
- O painel inicial da administração é identificado como “Início”; o painel de desempenho da equipe fica restrito ao administrador.
- O detalhe do chamado mantém o histórico de mensagens entre solicitante e técnico. O cliente vê a própria lista sem filtros.
- Cadastros, alterações e mensagens refletem na tela sem recarregar a página inteira; tipos de usuário e categorias de chamados têm gerenciamento exclusivo do administrador.

## 9. Repositório e quadro de tarefas

- **Repositório GitHub:** `https://github.com/LeandraAlves/UpDesk`
- **Integrantes com acesso:** Leandra, Karem, Gabriela e João Pedro Alvarenga — **convites/acessos a confirmar**.
- **Quadro de tarefas:** `PENDENTE — inserir URL após criação`
- **Colunas sugeridas:** A fazer → Em andamento → Em testes → Concluído.

### Tarefas iniciais

- [x] Criar repositório e adicionar todos os integrantes.
- [x] Criar quadro de tarefas e distribuir responsabilidades.
- [ ] Validar e, se necessário, refinar os esboços das oito telas com o professor.
- [ ] Revisar e finalizar o DER.
- [ ] Apresentar a proposta e obter aprovação do professor.

## 10. Cronograma de releases

| Release | Entrega prevista |
|---|---|
| Release 1 — Concepção | Tema, equipe, backlog, requisitos, tecnologias, esboços, DER, repositório e quadro de tarefas |
| Release 2 — Fundação | Frontend/backend/banco integrados, autenticação, primeiro CRUD e deploy inicial |
| Release 3 — Funcionalidades | CRUDs, relacionamentos, permissões, regra de negócio, filtros, paginação e oito telas |
| Release 4 — Versão final | Extras, testes, correções, README final, deploy e preparação da apresentação |

## 11. Situação do projeto

**Release atual:** Requisitos da Release 3 implementados; deploy excluído do escopo atual.
**Pendências:** confirmar commits de todos os integrantes, notificações por e-mail, log de auditoria, testes de integração com MySQL e deploy. O esboço das telas permanece como referência visual.

---

**Uso de IA:** A IA foi utilizado como apoio à organização e redação da proposta da Release 1.
