# Contexto do projeto: Central de Monitoramento de Manutenção Preventiva por Horímetro

> Documento de passagem de contexto. Se você é um LLM assumindo a conversa, leia tudo antes de responder.
> Última atualização: 03/11/2026. Estado atual: base funcionando; CRUD de equipamentos escrito e aguardando compilação e validação manual. Próximo passo: executar essa validação e corrigir eventuais problemas antes de iniciar planos.

---

## 1. Sobre o usuário e como ajudá-lo

- Fala **português do Brasil**. Responda sempre em português.
- Está construindo este projeto como **entregável avaliado** (processo seletivo/avaliação técnica na empresa).
- Já teve contato com React; não tem preferência forte de framework (a empresa aceita React, Angular e Vue).
- Usa **Linux** (caminho `/home/ely/Projects/central-manutencao`), IDE ainda não confirmada.
- **Quer entender tudo e saber explicar o porquê de cada decisão** (vai apresentar em vídeo e talvez ser questionado). Portanto:
  - Sempre explique o *porquê* e cite a alternativa descartada.
  - Seja honesto sobre limites: não afirme que algo foi validado se não foi.
  - Prefira passos pequenos e verificáveis, com um comando ou checagem para confirmar cada um.
  - Quando ele colar um erro, diagnostique a causa pelo log antes de sugerir correção.
- Não precisa de arquivos extras de documentação, a menos que ele peça.

## 2. Entregáveis do projeto

1. Código-fonte em repositório Git.
2. README com instruções de instalação e execução.
3. Link de vídeo de apresentação (até 5 minutos).

**Escopo funcional exigido:**

- Cadastro de equipamentos
- Cadastro de planos de manutenção
- Registro de leituras de horímetro
- Identificação de manutenções próximas ou vencidas
- Painel de alertas
- Registro ou agendamento de manutenção

**Restrições tecnológicas:** backend Java + Spring Boot; frontend em framework JS moderno (React escolhido); API REST; banco livre.

**Hospedagem:** apenas local (`docker compose up --build`). Deploy público foi descartado por ora; entra no README como melhoria futura. Se algum dia for hospedar: Vercel só serve o frontend; o Spring Boot precisaria de outro serviço (ex.: Render com Docker) e o plano gratuito hiberna e o Postgres gratuito expira.

---

## 3. Stack real (já em uso e validada)

| Camada | Tecnologia |
|---|---|
| Linguagem | Java **21** (JDK, não JRE) |
| Framework | **Spring Boot 4.1.2** (Spring Framework 7, Hibernate **7.4.13**, Tomcat **11.0.27**) |
| Build | Maven (wrapper `./mvnw`) |
| Banco | PostgreSQL **16** (container `postgres:16-alpine`) |
| Migrations | Flyway |
| API docs | springdoc-openapi **3.x** (série para Boot 4; a 2.8.x é para Boot 3) |
| Actuator | health, info |
| Frontend | React + Vite + TypeScript |
| Libs do frontend | React Router, TanStack Query, React Hook Form + Zod, MUI, Vitest + React Testing Library, openapi-typescript |
| Infra | Docker Compose (db + api + web), nginx servindo o frontend e fazendo proxy de `/api` |

### ⚠️ Atenção: o projeto está no Spring Boot 4, não no 3

Não gere código assumindo Spring Boot 3. Pontos a verificar na documentação antes de escrever código (podem ter mudado em relação ao Boot 3):

- Nomes e módulos de **starters** e de autoconfiguração (o Boot 4 é mais modular).
- **Jackson**: o Boot 4 migrou para o Jackson 3 (pacotes `tools.jackson.*` para o core/databind; as anotações continuam em `com.fasterxml.jackson.annotation`). Confirme no `pom.xml` e no classpath.
- **Hibernate 7**: mudanças de API e de mapeamento de tipos em relação ao 6.
- **Testcontainers** e `@ServiceConnection`: confirme os pacotes e artefatos exigidos pelo Boot 4.
- Se não tiver certeza, **diga que precisa conferir** em vez de inventar.

Pacote base provável: `com.elysium.central.manutencao` (classe principal `CentralManutencaoApplication`; a abreviação do log é `c.e.c.m`). **Confirme na árvore real antes de criar pacotes.**

---

## 4. Estado atual

### Atualização de progresso — 03/11/2026

- O usuário confirmou que a base (`docker compose up --build`) está funcionando.
- O usuário atualizou o springdoc para a série 3.x, adequada ao Spring Boot 4; conferir o `pom.xml` real antes de assumir versão específica.
- Em 03/11, ao investigar o Swagger, foi identificada a versão 3.0.0 no `pom.xml`. Atualizada para 3.2.0, versão cujo projeto declara alinhamento com Spring Boot 4.1.2. A hipótese é que a geração OpenAPI falhava mesmo com os endpoints REST respondendo; aguarda rebuild e validação pelo usuário. Referências: [releases springdoc](https://github.com/springdoc/springdoc-openapi/releases) e [issue de compatibilidade 3.0.0/Jackson](https://github.com/springdoc/springdoc-openapi/issues/3157).
- CRUD de equipamentos implementado no pacote `backend/src/main/java/com/elysium/central/manutencao/equipamento/`.
- Endpoints escritos: `POST /api/v1/equipamentos`, `GET /api/v1/equipamentos` com filtros/paginação, `GET /{id}`, `PUT /{id}` e `DELETE /{id}` para inativar.
- Regras cobertas no código: horímetro inicial apenas no cadastro; atualização cadastral não altera horímetro; validação dos campos por Bean Validation; código duplicado retorna conflito; exclusão é lógica; `@Version` mapeia o lock otimista.
- `git diff --check` passou. **Compilação, inicialização com Hibernate `ddl-auto: validate`, uso pelo Swagger e testes ainda não foram executados**; não considerar a feature validada até isso acontecer.
- Forma de trabalho combinada: implementar em etapas pequenas e explicar responsabilidades e motivos para o usuário conseguir apresentar o projeto. Usuário prefere realizar manualmente o que for razoável para economizar tokens, mas precisa de suporte concreto na criação/codificação das features.
- Prazo do desafio: 08/11/2026 às 23h59. Priorizar fluxo completo, documentação, testes e preparo para apresentação.

O restante desta seção registra o estado e as pendências do planejamento original; use a atualização acima como referência quando houver divergência.

### Feito e validado pelo usuário

- Repositório Git criado (monorepo) com `backend/`, `frontend/` e `docs/`.
- Backend gerado pelo Spring Initializr; sobe em ~2,6 s.
- `application.yml` configurado (o `application.properties` foi removido).
- Migration `V1__schema.sql` aplicada com sucesso (4 tabelas + índices + constraints).
- Swagger ativo (ainda sem endpoints).
- Frontend gerado pelo Vite (react-ts).
- `docker compose up --build`: **os três containers subiram corretamente e o usuário confirmou que tudo está funcionando.**

### Pendências de infraestrutura/documentação do planejamento original

- [ ] Trocar o `ENTRYPOINT` do `backend/Dockerfile` para `["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]`. Sem o `exec`, o sinal de parada pode não chegar à JVM.
- [ ] Confirmar o proxy `/api` no `frontend/vite.config.ts` (`target: http://localhost:8080`, `changeOrigin: true`).
- [ ] Commit e push da base (`chore: add database schema, docker setup and base configuration`).
- [ ] Esqueleto do `README.md`.

### Ressalva importante de validação

O `ddl-auto: validate` ainda **não validou nada de fato**: o log mostra `Found 0 JPA repository interfaces` e não há entidades. A validação real só acontece quando as entidades forem criadas. Se houver divergência de tipo entre entidade e schema (ex.: `Instant`/`OffsetDateTime` ↔ `TIMESTAMPTZ`, `BigDecimal` ↔ `NUMERIC(10,1)`, enum ↔ `VARCHAR`), o erro aparecerá na subida.

---

## 5. Estrutura do repositório

```
central-manutencao/
├── .gitattributes             # mvnw com LF (evita quebra no container Linux)
├── .gitignore
├── .env.example               # POSTGRES_DB/USER/PASSWORD = manutencao
├── README.md                  # ainda é esqueleto
├── docker-compose.yml         # db + api + web (funciona sem .env)
├── docs/
│   ├── telas.md               # inventário de telas (fonte de verdade da UI)
│   ├── modelo-de-dados.md     # ER em Mermaid + dicionário + constraints
│   └── contexto-para-llm.md   # este arquivo
├── backend/
│   ├── Dockerfile             # multi-stage (JDK build -> JRE runtime, usuário não-root)
│   ├── .dockerignore
│   ├── pom.xml
│   ├── mvnw / .mvn/
│   └── src/main/
│       ├── java/com/elysium/central/manutencao/CentralManutencaoApplication.java
│       └── resources/
│           ├── application.yml
│           └── db/migration/V1__schema.sql
└── frontend/
    ├── Dockerfile             # node:22 build -> nginx:1.27-alpine
    ├── nginx.conf             # serve SPA + proxy /api/ -> http://api:8080
    ├── .dockerignore
    ├── package.json
    ├── vite.config.ts
    └── src/
```

**Organização planejada do backend: por feature, não por camada técnica:**

```
.../manutencao/
├── equipamento/   # Controller, Service, Repository, entity, dto, mapper
├── plano/
├── leitura/
├── manutencao/
├── alerta/        # cálculo de status + queries do painel
└── shared/        # exception handler (ProblemDetail), config, base
```

**Organização planejada do frontend (por feature):**

```
frontend/src/
├── main.tsx
├── app/        # router, providers, queryClient, theme (tokens do Figma)
├── api/        # cliente HTTP + tipos gerados do OpenAPI
├── features/   # dashboard, equipamentos, planos, leituras, manutencoes
├── shared/     # components (StatusBadge, KpiCard...), hooks, utils (formatação)
└── layouts/    # AppLayout (sidebar + topbar)
```

---

## 6. Como tudo se conecta (arquitetura em execução)

```
Navegador ──► nginx (:3000) ──┬─► arquivos do React
                              └─► /api/*  ──► Spring Boot (:8080) ──► PostgreSQL (:5432)
```

- Compose: `db` (healthcheck `pg_isready`) → `api` (espera `db` saudável; healthcheck via `wget` no `/actuator/health`) → `web` (espera `api` saudável).
- A `api` recebe `DB_URL`, `DB_USER`, `DB_PASSWORD` por variável de ambiente (padrões no `application.yml` apontam para `localhost`, para rodar pela IDE).
- **Proxy em vez de CORS:** o navegador só fala com uma origem. O front chama sempre `/api/v1/...`; em dev o proxy do Vite faz o repasse, em Docker o nginx. Não há CORS configurado nem URL da API embutida no bundle.
- Portas: `3000` (web), `8080` (api/Swagger/actuator), `5432` (db).
- URLs úteis: `http://localhost:3000`, `http://localhost:8080/actuator/health`, `http://localhost:8080/swagger-ui.html`.

### Rodar em desenvolvimento

```bash
docker compose up -d db
cd backend && ./mvnw spring-boot:run      # atenção ao hífen em spring-boot
cd frontend && npm run dev                # http://localhost:5173
```

### Rodar tudo em containers

```bash
docker compose up --build
```

---

## 7. Decisões de projeto e justificativas

### Repositório e processo
| Decisão | Motivo |
|---|---|
| Monorepo | Entregável pede um repositório; um clone, um README, um `compose up` |
| Conventional Commits, commits pequenos, branches curtas por feature | Histórico legível |
| `.env.example` versionado, `.env` ignorado | Mostra variáveis sem expor segredos |
| Código de domínio em português (`Equipamento`, `PlanoManutencao`), infraestrutura em inglês | Convenção adotada |

### Banco
| Decisão | Motivo |
|---|---|
| PostgreSQL | Robusto, gratuito, sobe em container (H2 em memória foi descartado) |
| Flyway com SQL versionado, `ddl-auto: validate` | Schema revisável e reprodutível; o Hibernate só confere. **Nunca editar migration já aplicada**: criar `V2`, `V3`... |
| `GENERATED ALWAYS AS IDENTITY` | Padrão SQL moderno; **não se informa id manualmente nem em seeds** |
| `NUMERIC(10,1)` para horas (`BigDecimal`) | Exatidão decimal; `double` acumula erro e comparações definem vencimento |
| `TIMESTAMPTZ` | Instante absoluto em UTC |
| Enums como `VARCHAR` + `CHECK` (`@Enumerated(STRING)`) | Evolução simples; `ORDINAL` é frágil |
| `CHECK` no banco além da validação no código | Defesa em profundidade (bugs e concorrência) |
| Índice único parcial `manutencao(plano_id) WHERE status='AGENDADA'` | Garante atomicamente um agendamento aberto por plano |
| `proximo_vencimento` persistido + `CHECK (= horimetro_ultima_execucao + intervalo_horas)` | Permite indexar e consultar fácil; o CHECK impede inconsistência |
| Status do plano **não** persistido | Depende do horímetro atual, que muda a cada leitura; calculado na hora nunca desatualiza |
| `equipamento.version` (lock otimista) | Duas leituras simultâneas: uma falha com 409 em vez de sobrescrever |
| `equipamento.data_ultima_leitura` redundante | Evita subconsulta nas listagens e no painel; atualizada na mesma transação da leitura |
| Inativar equipamento em vez de apagar | Preserva histórico; FKs sem CASCADE |
| Índices dentro da `V1` | Projeto novo, uma migration só; `V2` reservada ao seed |
| Alertas sem tabela | Derivados de `horimetro_atual` × `proximo_vencimento` |

### Backend
| Decisão | Motivo |
|---|---|
| `open-in-view: false` | Evita lazy loading escondido no controller; carregar no Service e devolver DTOs |
| DTOs como `record`, **sem Lombok** | Java 21 resolve; código mais limpo |
| `spring.mvc.problemdetails.enabled: true` + handler global | Erros no padrão RFC 7807 (`ProblemDetail`) |
| `server.error.include-message: never` | Não vaza mensagens internas |
| Actuator expondo só `health,info` | Reduz superfície exposta |
| `hibernate.jdbc.time_zone: UTC` | Consistência de datas |
| Swagger (springdoc 3.x) | Contrato da API, teste sem Postman e geração de tipos no front |
| Configuração por variável de ambiente com padrão local | O mesmo build roda na IDE e no Docker |

### Docker
| Decisão | Motivo |
|---|---|
| `healthcheck` + `depends_on: service_healthy` | `depends_on` simples só espera iniciar, não estar pronto |
| `${VAR:-padrão}` no compose | `compose up --build` funciona sem criar `.env` (importante para o avaliador) |
| `$${POSTGRES_USER}` no healthcheck | Escapa a interpolação do Compose; o shell do container expande |
| Multi-stage no backend | Imagem final só com JRE + jar; cache de dependências por camada (`pom.xml` copiado antes do `src`) |
| Usuário não-root | Segurança |
| `MaxRAMPercentage=75` | JVM respeita o limite do container |
| `-DskipTests` no build da imagem | Testcontainers precisa de Docker, indisponível dentro do build; testes rodam via `./mvnw test` |
| nginx com `try_files ... /index.html` | O React Router resolve rotas no cliente; sem isso, F5 em rota interna dá 404 |
| Volume `pgdata` | Dados sobrevivem a `down`; `down -v` apaga e o Flyway recria |

### Frontend
| Decisão | Motivo |
|---|---|
| React + Vite + TS | Usuário já teve contato; a empresa aceita |
| TanStack Query | Cache, loading e erro; invalidação após mutações atualiza o painel sozinho |
| React Hook Form + Zod | Formulários e validação tipada |
| MUI | Tabela, diálogo e date picker prontos; acelera sem aparência de template (shadcn/ui foi considerado e deixado de lado por dar mais trabalho de montagem) |
| `openapi-typescript` | Tipos do front gerados do contrato da API, sem digitar DTO duas vezes |

---

## 8. Modelo de dados (resumo)

Fonte de verdade: `backend/src/main/resources/db/migration/V1__schema.sql` e `docs/modelo-de-dados.md` (ER em Mermaid).

- **equipamento**: `id`, `codigo` (UNIQUE, a TAG), `nome`, `tipo`, `fabricante`, `modelo`, `numero_serie`, `localizacao`, `status` (`ATIVO` | `EM_MANUTENCAO` | `INATIVO`), `horimetro_atual`, `data_ultima_leitura`, `version`, `criado_em`, `atualizado_em`.
- **plano_manutencao**: `id`, `equipamento_id` FK, `nome`, `intervalo_horas` (> 0), `antecedencia_alerta_horas` (≥ 0 e < intervalo), `horimetro_ultima_execucao`, `proximo_vencimento`, `ativo`, timestamps.
- **leitura_horimetro**: `id`, `equipamento_id` FK, `valor` (≥ 0), `data_hora`, `responsavel` (NOT NULL), `observacao`, `criado_em`.
- **manutencao**: `id`, `equipamento_id` FK, `plano_id` FK (opcional, para corretiva avulsa), `tipo` (`PREVENTIVA` | `CORRETIVA`), `status` (`AGENDADA` | `CONCLUIDA` | `CANCELADA`), `data_agendada` (obrigatória se AGENDADA), `data_execucao` e `horimetro_execucao` (obrigatórios se CONCLUIDA), `responsavel`, `observacoes`, timestamps.

Constraints e índices principais: ver o SQL. O `CHECK` do plano garante `proximo_vencimento = horimetro_ultima_execucao + intervalo_horas`.

---

## 9. Regras de negócio (o coração do projeto)

- **Próximo vencimento** = horímetro da última execução + intervalo.
- **Restante** = `proximo_vencimento − horimetro_atual`.
- **Status do plano (calculado, nunca gravado):**
  - `VENCIDA` se restante ≤ 0
  - `PROXIMA` se restante ≤ antecedência de alerta
  - `EM_DIA` caso contrário
- **Leitura:** não pode ser menor que a última (igual é aceita), não pode estar no futuro e não pode ser de equipamento inativo. Ao registrar, atualiza `horimetro_atual` e `data_ultima_leitura` **na mesma transação** (lock otimista via `@Version`).
- **Agendamento:** só para plano ativo; sem duplicar agendamento aberto para o mesmo plano (validado no Service e garantido pelo índice parcial).
- **Conclusão:** `horimetro_execucao` é obrigatório (a UI sugere o atual). O plano passa a ter `horimetro_ultima_execucao = horimetro_execucao` e recalcula `proximo_vencimento`. *Convenção adotada: o ciclo recomeça a partir do horímetro real da execução. A alternativa, de ciclo fixo, seria vencimento antigo + intervalo. Se o usuário preferir, é uma decisão a confirmar.*
- **Exclusão:** equipamento com histórico é inativado (soft delete).
- **Horímetro da última execução** do plano não pode ser maior que o horímetro atual do equipamento.
- **Horímetro inicial** do equipamento só é informado na criação; depois só muda por leitura.
- Opcional (se sobrar tempo): previsão de vencimento pela média diária de uso dos últimos 30 dias.

### Casos de teste de referência (viram testes JUnit; tabela formal ainda a ser feita)

Plano de 250 h, última execução em 1.250 h → vencimento 1.500 h, antecedência 50 h:

| Horímetro atual | Restante | Status esperado |
|---|---|---|
| 1.400 | 100 | EM_DIA |
| 1.450 | 50 | PROXIMA (limite inclusivo) |
| 1.480 | 20 | PROXIMA |
| 1.500 | 0 | VENCIDA |
| 1.510 | −10 | VENCIDA |

Outros casos: leitura menor que a anterior → 422; leitura igual → aceita; leitura futura → 422; equipamento inativo → 422; segundo agendamento aberto no mesmo plano → 409; TAG duplicada → 409; plano inativo não agenda; concluir com execução em 1.510 h num plano de 250 h → novo vencimento 1.760 h.

---

## 10. API REST (`/api/v1`)

Os controllers mapeiam `/api/v1/...` diretamente (sem `server.servlet.context-path`, para não quebrar Swagger e actuator). O CRUD de equipamentos está escrito; falta validar seu funcionamento.

| Recurso | Endpoints |
|---|---|
| Equipamentos | `GET /equipamentos` (filtros + paginação), `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` (inativa) — implementados, ainda não validados; `GET /{id}/resumo` planejado |
| Planos | `GET /planos?equipamentoId=`, `POST`, `PUT /{id}`, `PATCH /{id}/status` |
| Leituras | `POST /equipamentos/{id}/leituras`, `GET /equipamentos/{id}/leituras?de=&ate=` (a listagem global usa filtros próprios) |
| Manutenções | `GET /manutencoes?status=&equipamentoId=`, `POST` (agendar/registrar), `PUT /{id}`, `POST /{id}/concluir`, `POST /{id}/cancelar` |
| Alertas | `GET /alertas?nivel=VENCIDA\|PROXIMA` |
| Dashboard | `GET /dashboard/resumo` (contadores, top críticos, próximas agendadas) |

**Erros:** `ProblemDetail` (RFC 7807), com erros de validação por campo. Códigos: 400 (validação), 404 (não encontrado), 409 (conflito: TAG duplicada, agendamento duplicado, lock otimista), 422 (regra de negócio).

---

## 11. Telas (resumo; detalhes em `docs/telas.md`)

Rotas: `/` (Painel), `/equipamentos`, `/equipamentos/novo`, `/equipamentos/:id/editar`, `/equipamentos/:id` (detalhe com abas Planos/Leituras/Manutenções/Dados), `/planos`, `/leituras`, `/manutencoes`.

- **Não há tela separada de Alertas**: o Painel é a tabela de alertas, com KPIs clicáveis (Vencidas, Próximas, Em dia, Agendadas) e ações por linha (registrar leitura, agendar, ver equipamento).
- **Diálogo "Registrar leitura"** é o fluxo mais importante: mostra a última leitura, valida valor e data, e ao salvar exibe o impacto ("Plano X passou a VENCIDA").
- **Diálogo "Concluir manutenção"** sugere o horímetro atual e mostra o novo vencimento antes de confirmar.
- Semáforo vermelho/âmbar/verde **sempre com ícone e texto** (acessibilidade). Skeleton em loading, estados vazios com ação, `ErrorState` com retry, responsivo (operador usa celular).
- Horas formatadas em pt-BR (`1.510,5 h`); datas `dd/MM/yyyy HH:mm`.
- Após cada mutação, invalidar as queries do painel, do detalhe e das listas relacionadas.
- Planos são criados dentro do detalhe do equipamento; a tela global `/planos` é de consulta e edição rápida.

**Figma:** ainda não feito. Plano: wireframes de baixa fidelidade de tudo (2–3 h), tokens (30 min), alta fidelidade só de Painel, Detalhe do equipamento e Diálogo de leitura (3–4 h), estados vazio/loading/erro e mobile para o Painel e a leitura. Limite: um dia.

---

## 12. Roadmap

| Fase | Conteúdo | Status |
|---|---|---|
| 0. Setup | Repo, Docker, esqueletos, Flyway V1 | **Concluída** segundo confirmação do usuário; conferir pendências históricas antes de retomá-las |
| Planejamento restante | Tabela de casos de teste, Figma, cenários do seed | A fazer |
| 1. Backend base | CRUD de equipamentos e planos, `ProblemDetail`, Swagger | CRUD de equipamentos escrito (validar); planos e tratamento global ainda pendentes |
| 2. Regras | Leituras, cálculo de status, alertas, manutenções, dashboard, testes unitários e de integração (Testcontainers), seed `V2__seed_demo.sql` | A fazer |
| 3. Frontend | Layout, componentes compartilhados, telas de cadastro, depois Painel e fluxos de leitura/manutenção | A fazer |
| 4. Acabamento | Responsividade, acessibilidade, revisão de código, teste do compose do zero (`down -v`) | A fazer |
| 5. Entregáveis | README completo, vídeo, revisão do histórico Git, clonar em pasta limpa e seguir o README | A fazer |

### Checklist detalhado por fase

**Fase 1 (backend base)**
- [x] Estrutura de pacotes por feature (iniciada com `equipamento`)
- [ ] `shared`: handler global de erros (`ProblemDetail`) e exceções de domínio
- [x] Equipamento: entidade (com `@Version`), enums, repository, DTOs `record`, service, controller — escrito, ainda não validado
- [x] Equipamento: filtros + paginação, inativação, TAG duplicada → 409 — escrito, ainda não validado
- [ ] Plano: CRUD, cálculo de `proximo_vencimento`, ativar/desativar
- [ ] Conferir que o `validate` passa com as entidades
- [ ] Testar pelo Swagger; commit por feature

**Fase 2 (regras)**
- [ ] Cálculo de status isolado em classe própria, fácil de testar
- [ ] Leitura com validações e atualização transacional do equipamento
- [ ] Manutenção: agendar, registrar já realizada, concluir (recalcula plano), cancelar, bloqueio de duplicidade
- [ ] Alertas (vencidos/próximos, ordenados por atraso) e endpoint do dashboard
- [ ] Testes unitários (tabela de casos → JUnit) e de integração (Testcontainers)
- [ ] Seed com 10–15 equipamentos cobrindo vencida, próxima e em dia, desenhado para a história do vídeo (sem informar `id`, que é `GENERATED ALWAYS`)

**Fase 3 (frontend)**
- [ ] MUI + React Router + TanStack Query + tema com tokens do Figma
- [ ] Tipos gerados do OpenAPI e cliente HTTP
- [ ] `AppLayout` (sidebar, topbar, botão **+ Leitura**)
- [ ] Componentes: `StatusBadge`, `KpiCard`, `PlanoProgresso`, `HorasInput`, `EquipamentoAutocomplete`, `ConfirmDialog`, `EmptyState`, `ErrorState`, `PageHeader`
- [ ] Equipamentos (lista, formulário, detalhe), planos, diálogo de leitura, manutenções, Painel
- [ ] Testes de componentes críticos

**Fase 5 (entregáveis)**
- [ ] README: visão geral, screenshots, diagrama de arquitetura, pré-requisitos (Docker, ou JDK 21 + Node 20+), execução rápida e manual, regras de negócio, testes, decisões, melhorias futuras (autenticação JWT, notificações por e-mail, previsão por média de uso, deploy)
- [ ] Roteiro do vídeo (≤ 5 min): problema e visão geral (0:00–0:30) → painel de alertas (–1:30) → cadastro de equipamento e plano (–2:30) → registrar leitura e ver o alerta mudar (–3:30) → agendar e concluir manutenção com novo vencimento (–4:15) → arquitetura, Swagger, testes e decisões (–5:00). Gravar com o seed carregado.

---

## 13. Problemas já resolvidos (para não repetir)

| Problema | Causa | Lição |
|---|---|---|
| `No plugin found for prefix 'springboot'` | Typo | O prefixo correto é `spring-boot` |
| `No compiler is provided in this environment` | Havia JRE, não JDK | Instalar `openjdk-21-jdk` (JDK compila, JRE só executa) |
| Dependência do springdoc "reclamando" | O exemplo inicial usava `2.8.x`, que não é uma versão real; além disso a série 2.8 é para Boot 3 | Projeto está no Boot 4: usar springdoc **3.x** |
| `No migrations found` no Flyway | Pasta `db/migration` existia mas o `V1__schema.sql` não tinha sido copiada | O Flyway lê do classpath; o log do build (`Copying 1 resource` em vez de 2) já denunciava. Nome exato: `V1__schema.sql` (dois underscores) |
| Avisos `401` de `flyway-community-db-support` e `MavenFeed` | Repositórios de metadados que exigem autenticação | Inofensivos, ignorar |
| Avisos `WARN` do SpringDoc ao subir | Swagger ligado por padrão | Ignorar em dev; em produção, desligar |

---

## 14. Regras de conduta para quem continuar

1. **Não assuma Boot 3.** Verifique APIs, starters e pacotes para Spring Boot 4.1.x / Spring Framework 7 / Hibernate 7. Se não tiver certeza, diga e peça para conferir.
2. **Não edite `V1__schema.sql`.** Mudanças de schema entram em `V2`, `V3`... (o checksum do Flyway quebraria).
3. **Não informe `id` em INSERTs** (`GENERATED ALWAYS`).
4. **Não use Lombok.** DTOs como `record`.
5. **Não persista o status do plano**; calcule.
6. **Mantenha a estrutura por feature** e o idioma (domínio em português, infraestrutura em inglês).
7. **Commits pequenos e Conventional Commits** (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
8. Toda validação de regra deve existir no Service **e**, quando possível, no banco.
9. Explique o porquê das escolhas; o usuário precisa defender o projeto em vídeo.
10. Cada passo deve vir com uma forma de verificar (comando, URL, trecho de log esperado).
11. Não afirme que algo foi validado sem evidência (ex.: o `validate` do Hibernate ainda não foi exercitado).

---

## 15. Próximo passo sugerido

Fechar as quatro pendências da Fase 0 e, em seguida, escrever o **CRUD de equipamentos** completo em Spring Boot 4 (entidade com `@Version`, repository, DTOs `record`, service, controller, handler global `ProblemDetail`, filtros e paginação, inativação, TAG duplicada → 409). Essa primeira feature serve de molde para planos, leituras e manutenções.
