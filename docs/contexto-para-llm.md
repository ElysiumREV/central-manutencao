# Contexto do projeto: Central de Monitoramento de Manutenção Preventiva por Horímetro

> Documento de passagem de contexto. Se você é um LLM assumindo a conversa, leia tudo antes de responder.
> Última atualização: 06/11/2026. Estado atual: backend, telas operacionais, autenticação, seed e handler global de erros implementados; 22 testes passam. Próximos focos: ações do Painel, tipos OpenAPI no frontend, teste em clone limpo, screenshots e vídeo.

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
| Segurança | Spring Security HTTP Basic, usuário de demonstração em memória e credenciais configuráveis por ambiente |
| Frontend | React + Vite + TypeScript |
| Libs do frontend | React Router, TanStack Query e MUI em uso; React Hook Form, Zod, Vitest/Testing Library e openapi-typescript estão instalados, mas ainda não são usados nas telas |
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
- Após a atualização, o usuário confirmou que o Swagger está funcionando e lista as ações da controller de equipamentos. Isso confirma a geração do contrato OpenAPI e a renderização da UI; cada operação ainda precisa ser exercitada individualmente.
- O usuário informou que percorreu as operações de equipamentos no Swagger. O `DELETE /api/v1/equipamentos/{id}` é exclusão lógica: muda `status` para `INATIVO` e responde `204 No Content`; verificar por `GET /api/v1/equipamentos/{id}`. O registro permanece no banco para preservar histórico e relacionamentos.
- O usuário iniciou a feature de manutenção criando `Manutencao.java` e `ManutencaoController.java`. Rascunho ainda incompleto: entidade tem divergências do schema (`equipamento_id`/`plano_id` como campos gerados, colunas nullable/unique incorretas, tipo/status como `String`); controller tem rota singular, método `listar` incompleto e dependências DTO/Service ainda não criadas. Revisar junto ao usuário antes de continuar; explicar enumerações, chaves estrangeiras e campos opcionais/condicionais.
- Depois, por decisão de acelerar a implementação, backend de planos e manutenções foi completado no código. Planos: `POST/GET/GET por id/PUT/PATCH status`, validação de intervalo e antecedência, horímetro de execução não superior ao atual, vencimento calculado e status derivado. Manutenções: `POST` agendar, `POST /concluidas` registrar execução imediata, consultas paginadas, concluir e cancelar. Preventiva exige plano; equipamento/plano são validados; conclusão preventiva atualiza horímetro da última execução e vencimento dentro da mesma transação.
- Os rascunhos de `Manutencao.java` e `ManutencaoController.java` foram substituídos por implementação alinhada ao schema. `./mvnw -DskipTests compile` compilou 28 arquivos Java com sucesso (03/11); testes não foram executados. **Ainda falta validar o mapeamento Hibernate ao iniciar com PostgreSQL e exercitar endpoints/regras pelo Swagger.**
- O usuário informou que refez o `docker compose up` com os serviços e que parecem estar funcionando. Registrar como inicialização confirmada segundo o usuário; a validação do Hibernate se aplica se a imagem do backend foi reconstruída com as entidades novas. Operações de plano/manutenção ainda precisam ser exercitadas.
- Feature de leituras implementada: `POST /api/v1/equipamentos/{id}/leituras`, histórico global `GET /api/v1/leituras` e por equipamento `GET /api/v1/equipamentos/{id}/leituras`, com filtro de período/paginação. Atualiza horímetro e data da última leitura na transação que insere o histórico; valida horímetro não decrescente, data não futura e equipamento não inativo; `@Version` trata concorrência. `./mvnw -DskipTests compile` compilou 34 arquivos Java com sucesso (03/11). Testes não executados; ainda validar inicialização e comportamento pelo Swagger.
- Revisão estática das features (03/11): mapeamentos e constraints foram comparados com a V1; removida consulta de leitura não usada, nome do path variable ficou explícito e o agendamento passou a verificar duplicidade antes de salvar, mantendo a proteção do índice único parcial contra concorrência. Compilação após os ajustes passou (`./mvnw -DskipTests compile`, 34 arquivos). O usuário relata ter testado as operações pelo Swagger; não foi possível consultar `localhost:8080` a partir do ambiente do agente, então essa validação manual fica registrada como informada pelo usuário.
- Alertas e dashboard implementados (03/11): `GET /api/v1/alertas` retorna planos ativos em atraso ou dentro da antecedência, com filtro opcional de nível (`VENCIDA`/`PROXIMA`), tipo de equipamento e busca textual; ordena pelo menor número de horas restantes. `GET /api/v1/dashboard/resumo` retorna contadores de status, cinco alertas vencidos mais críticos e até cinco manutenções agendadas para os próximos sete dias (datas calculadas no fuso `America/Sao_Paulo`). O status é calculado em `PlanoManutencao` e reutilizado para evitar regra duplicada. Compilação passou (`./mvnw -DskipTests compile`, 42 arquivos); testes não executados. **Ainda precisa inicializar com PostgreSQL para validar queries JPQL e exercitar filtros/contadores pelo Swagger.**
- Correções de revisão (04/11): leitura com `dataHora` anterior à `dataUltimaLeitura` agora retorna 422. Sem isso, uma leitura retroativa com horímetro igual/maior era aceita e substituía o campo que representa a data da última leitura, deixando o resumo do equipamento temporalmente incorreto. Alertas empatados no total de horas restantes agora são ordenados por `plano.id`; isso estabiliza a ordem entre páginas, evitando itens repetidos ou pulados em paginação quando os valores restantes empatam. Validar no Swagger: tentar leitura com timestamp menor que a última (esperado 422) e consultar alertas com dois planos empatados (ordem por ID).
- Base inicial do frontend (04/11): removida tela padrão do Vite. Criado layout responsivo com navegação lateral, título, atalho para Swagger, página de dashboard ligada a `GET /api/v1/dashboard/resumo`, KPIs, tabela de alertas, próximas manutenções e estados de carregamento/erro/vazio. Rotas de equipamentos, planos, leituras e manutenções têm placeholders explícitos enquanto as telas são implementadas. React Router e TanStack Query foram conectados no `main.tsx`; idioma, título e descrição do documento ajustados para pt-BR. Motivo: estabelecer uma estrutura clara e demonstrável sem criar abstrações excessivas; manter as rotas reconhecíveis e avisar quais telas ainda não existem. `npm run build` passou após `npm ci`; ainda falta executar com backend e conferir visualmente no navegador.
- Correção do dashboard (04/11): logs do Docker mostraram `ERROR: function lower(bytea) does not exist` no PostgreSQL quando o resumo buscava alertas sem filtros. A query anterior chamava `lower()` sobre parâmetros opcionais nulos. Substituída por `AlertaSpecifications`, que adiciona os predicados de tipo e texto somente quando o filtro existe; mantém ordenação por restante e ID. Isso remove a avaliação de `lower(NULL)` e mantém os filtros opcionais. API reconstruída; container ficou healthy. Confirmados HTTP 200 para `/api/v1/dashboard/resumo` direto na API e via nginx, `/api/v1/alertas` sem filtros, com `nivel=VENCIDA` e com filtros de tipo/texto.
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
| Planos | `GET /planos?equipamentoId=&ativo=`, `POST`, `GET /{id}`, `PUT /{id}`, `PATCH /{id}/status` — escritos, ainda não validados |
| Leituras | `POST /equipamentos/{id}/leituras`, `GET /equipamentos/{id}/leituras?de=&ate=`, `GET /leituras?equipamentoId=&de=&ate=` — escritos e compilados; validar |
| Manutenções | `GET /manutencoes?status=&equipamentoId=`, `GET /{id}`, `POST` (agendar), `POST /concluidas` (registrar execução), `POST /{id}/concluir`, `POST /{id}/cancelar` — escritos, ainda não validados |
| Alertas | `GET /alertas?nivel=VENCIDA\|PROXIMA&tipo=&termo=` — escrito e compilado; validar no Swagger |
| Dashboard | `GET /dashboard/resumo` (contadores, top críticos, próximas agendadas) — escrito e compilado; validar no Swagger |

**Erros:** `ProblemDetail` (RFC 7807), com erros de validação por campo. Códigos: 400 (validação), 404 (não encontrado), 409 (conflito: TAG duplicada, agendamento duplicado, lock otimista), 422 (regra de negócio).

---

## 11. Telas (resumo; detalhes em `docs/telas.md`)

Rotas planejadas: `/` (Painel), `/equipamentos`, `/equipamentos/:id` (detalhe com abas Planos/Leituras/Manutenções/Dados), `/planos`, `/leituras`, `/manutencoes`. **Implementadas hoje:** `/`, `/equipamentos`, `/planos`, `/leituras` e `/manutencoes`; detalhe permanece planejado.

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
| 1. Backend base | CRUD de equipamentos e planos, `ProblemDetail`, Swagger e autenticação | Equipamentos, planos, leituras e manutenção compilam; autenticação HTTP Basic e handler global `ProblemDetail` implementados |
| 2. Regras | Leituras, alertas, dashboard, testes unitários e de integração (Testcontainers), seed `V2__seed_demo.sql` | Regras implementadas; 20 testes unitários/de integração passam com PostgreSQL 16 no Testcontainers; seed `V2` implementado |
| 3. Frontend | Layout, telas operacionais, integração e estados de interface | Painel, equipamentos, planos, leituras e manutenções implementados; ainda falta detalhe do equipamento, ações integradas do Painel e validação visual/integrada |
| 4. Acabamento | Responsividade, acessibilidade, revisão de código, teste do compose do zero (`down -v`) | A fazer |
| 5. Entregáveis | README completo, vídeo, revisão do histórico Git, clonar em pasta limpa e seguir o README | A fazer |

### Checklist detalhado por fase

**Fase 1 (backend base)**
- [x] Estrutura de pacotes por feature (iniciada com `equipamento`)
- [x] `shared`: handler global de erros (`ProblemDetail`) — exceções de domínio próprias não foram criadas; os services usam `ResponseStatusException`
- [x] Equipamento: entidade (com `@Version`), enums, repository, DTOs `record`, service, controller — escrito, ainda não validado
- [x] Equipamento: filtros + paginação, inativação, TAG duplicada → 409 — escrito, ainda não validado
- [x] Plano: CRUD, cálculo de `proximo_vencimento`, ativar/desativar — escrito e compilado; validar com banco/Swagger
- [ ] Conferir que o `validate` passa com as entidades
- [ ] Testar pelo Swagger; commit por feature

**Fase 2 (regras)**
- [ ] Cálculo de status isolado em classe própria, fácil de testar
- [x] Leitura com validações e atualização transacional do equipamento — escrita e compilada; validar pelo Swagger
- [x] Manutenção: agendar, registrar já realizada, concluir (recalcula plano), cancelar, bloqueio de duplicidade — escrito e compilado; validar com banco/Swagger
- [x] Alertas (vencidos/próximos, ordenados por atraso) e endpoint do dashboard — escritos e compilados; validar no Swagger
- [x] Testes unitários (limites de status e ciclo do plano) e de integração (atualização do plano, conclusão preventiva, duplicidade e leituras inválidas) — 12 passaram
- [ ] Seed com 10–15 equipamentos cobrindo vencida, próxima e em dia, desenhado para a história do vídeo (sem informar `id`, que é `GENERATED ALWAYS`)

**Fase 3 (frontend)**
- [x] React Router + TanStack Query + layout inicial e painel; cliente HTTP simples
- [x] Equipamentos: lista paginada, busca por TAG/nome, filtro por status, cadastro/edição e inativação com confirmação
- [ ] Tipos gerados do OpenAPI; por enquanto, a tela define os tipos usados localmente
- [x] Planos: filtro por equipamento/situação, lista, cadastro/edição e ativação/desativação
- [x] Leituras: histórico por período e registro com invalidação de dados relacionados
- [x] Manutenções: agenda/histórico, filtros, agendamento, conclusão e cancelamento
- [ ] Detalhe do equipamento e ações do painel ligadas diretamente aos fluxos
- [ ] Ações do painel ligadas aos fluxos (registrar leitura/agendar)
- [ ] Revisão de acessibilidade/responsividade e testes de componentes críticos

**Fase 5 (entregáveis)**
- [ ] README: visão geral, screenshots, diagrama de arquitetura, pré-requisitos (Docker, ou JDK 21 + Node 20+), execução rápida e manual, credenciais locais de demonstração, regras de negócio, testes, decisões, melhorias futuras (gestão persistente de usuários, autorização por função, notificações por e-mail, previsão por média de uso, deploy)
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

O backend já tem as features de equipamentos, planos, leituras, manutenção, alertas e dashboard. O frontend tem o painel e telas funcionais para as quatro áreas operacionais. Próximo: ligar as ações do Painel aos formulários, fazer o detalhe do equipamento e validar os fluxos ponta a ponta pelo Docker. Depois focar em testes, acabamento e entregáveis.

### Atualização de 2026-11-04 — primeira tela de equipamentos

A rota `/equipamentos` deixou de ser placeholder. Ela consome a API real e oferece listagem paginada, busca por TAG/nome, filtro de status, cadastro, edição e inativação lógica com confirmação. A edição não altera o horímetro: ele muda pelo fluxo de leitura, preservando o histórico e a regra de negócio. Erros de conflito de TAG são traduzidos para uma mensagem compreensível. A implementação reutiliza TanStack Query e um cliente HTTP pequeno; após mutações, invalida a consulta da lista.

**Motivo:** começar por equipamentos torna o dashboard navegável no uso real e cria o padrão de integração frontend/API que será reutilizado nas telas seguintes. O diálogo de formulário mantém a tela simples sem introduzir navegação e estrutura extra antes de haver necessidade.

**Verificação feita:** `cd frontend && npm run build` concluiu com sucesso (TypeScript e Vite). Na primeira compilação o TypeScript apontou uso de propriedade de parâmetro no construtor de `ApiError`, incompatível com `erasableSyntaxOnly`; a classe foi ajustada para declarar `status` explicitamente e o build passou.

### Atualização de 2026-11-04 — tela de planos

A rota `/planos` lista planos com filtro por equipamento e ativo/inativo, mostra intervalo, horímetro de vencimento e status calculados pela API, e permite criar, editar e ativar/desativar. Ao criar, o horímetro da última execução é preenchido com o horímetro atual do equipamento escolhido e pode ser ajustado para representar um ciclo iniciado antes do cadastro. Em edição, esse valor é apenas informativo: muda pelo fluxo de conclusão de manutenção preventiva. A tela invalida consultas de planos e o resumo do dashboard após alterações.

**Motivo:** a regra do próximo vencimento e o status pertencem ao domínio do backend; o frontend apenas exibe o resultado para manter uma fonte única de verdade. O plano está ligado a um equipamento desde sua criação, então a seleção é obrigatória e não muda na edição.

**Verificação feita:** `cd frontend && npm run build` concluiu com sucesso após integrar as rotas `/equipamentos` e `/planos`.

### Correção de 2026-11-04 — atualização segura do plano

A atualização comum (`PUT /api/v1/planos/{id}`) não aceita mais `horimetroUltimaExecucao`. O Service valida os campos de configuração usando o horímetro já persistido e chama `atualizarConfiguracao`; essa operação recalcula o próximo vencimento a partir do último horímetro registrado, sem alterar a execução. A entidade agora reserva a alteração desse valor a `registrarExecucao`, chamada quando uma manutenção preventiva é concluída. No formulário, o campo só é editável na criação; na edição, a tela informa o valor atual e que ele muda ao concluir a manutenção.

**Motivo:** permitir editar a última execução poderia deslocar artificialmente o próximo vencimento sem que um serviço tivesse ocorrido. A configuração do plano (nome, intervalo, antecedência e ativo) é separada do histórico operacional (execução e horímetro).

**Verificação feita:** `./mvnw -o clean compile` e `cd frontend && npm run build` passaram. API e frontend foram reconstruídos no Docker; API e banco ficaram saudáveis, e `GET /api/v1/planos?...` retornou HTTP 200 pelo proxy do Nginx. O banco manteve os registros existentes. A preservação do horímetro na atualização está coberta por teste de integração.

### Autenticação de acesso — 2026-11-04

Foi adicionada autenticação HTTP Basic com Spring Security. Todas as rotas da API exigem usuário e senha; `/actuator/health` e os recursos da documentação Swagger ficam públicos, mas as chamadas de negócio feitas pelo Swagger também exigem credenciais. `GET /api/v1/auth/session` retorna o nome do usuário autenticado e é usado pela tela de login do frontend. As credenciais vêm de `APP_AUTH_USERNAME` e `APP_AUTH_PASSWORD`; o usuário fica em memória e a senha é codificada com `PasswordEncoder` antes de ser cadastrada no `UserDetailsService`.

O frontend oferece formulário de login e ação de sair. O cabeçalho Basic fica apenas em memória JavaScript e é anexado pelo cliente HTTP compartilhado; ao recarregar a página, o usuário entra novamente. A API é stateless, sem sessão/cookie, por isso o CSRF fica desabilitado nesta configuração. No Docker há credenciais locais de demonstração substituíveis pelas variáveis de ambiente; não usar os valores demonstrativos fora do ambiente local.

**Limites assumidos:** existe um único usuário operador em memória, sem cadastro, recuperação de senha, persistência de usuários ou autorização por função. O Docker local usa HTTP; Basic apenas codifica (não criptografa) as credenciais no transporte, então qualquer implantação externa exige HTTPS e credenciais próprias. Essa implementação atende ao controle de acesso do protótipo, não é uma solução de identidade para produção.

**Verificação feita:** compilação limpa do backend, build de produção do frontend e rebuild Docker de API/web. Sem credenciais, `GET /api/v1/dashboard/resumo` retorna 401; `GET /api/v1/auth/session` autenticado retorna 200 tanto direto na API quanto pelo proxy Nginx; healthcheck público retorna 200. O JSON OpenAPI inclui o esquema `basicAuth` para autenticar chamadas no Swagger.

### Testes de regras de negócio — 2026-11-04

Foram adicionados seis testes unitários de `PlanoManutencao` cobrindo os limites `EM_DIA`/`PROXIMA`/`VENCIDA`, preservação da última execução ao atualizar configuração e avanço do ciclo ao registrar execução. Cinco testes de integração com PostgreSQL 16 via Testcontainers cobrem atualização do plano preservando o horímetro, conclusão preventiva recalculando o vencimento, conflito de agendamento duplicado e rejeição de leituras retroativas/regressivas. As credenciais de teste são propriedades locais do contexto de teste.

**Verificação feita:** `./mvnw clean test` terminou com BUILD SUCCESS: 12 testes, zero falhas, zero erros. O container do Testcontainers usa `postgres:16-alpine`, alinhado ao banco do Compose.

### Atualização de 2026-11-04 — leituras e manutenções

As rotas `/leituras` e `/manutencoes` agora usam a API real. Leituras oferece histórico paginado com filtro por período e registro de nova leitura; após salvar, invalida as consultas de equipamentos, planos e dashboard, pois a medição pode mudar o horímetro atual e o status de alertas. Manutenções oferece filtro por status, agendamento (preventiva ligada a plano ativo ou corretiva), conclusão com horímetro/data e cancelamento com motivo. Ao concluir ou alterar uma manutenção, atualiza o histórico, os planos e o dashboard.

**Motivo:** esses são os fluxos que mudam o estado do negócio. O frontend comunica as ações e exibe as validações retornadas pelo serviço; a API continua responsável por validar datas, sequência do horímetro, vínculo plano/equipamento e transições de status.

**Verificação feita:** `cd frontend && npm run build` passou após integrar as telas de leituras e manutenções; `git diff --check` também passou. Ainda falta o teste manual integrado usando os containers atualizados.

### Correção de 2026-11-04 — telas não carregavam as listas

**Sintoma observado:** o dashboard continuava respondendo, mas as rotas de equipamentos, planos, leituras e manutenções falhavam ao carregar listas. O proxy do Nginx encaminhava as requisições corretamente; os registros dele mostravam HTTP 500 vindos da API.

**Causa:** consultas JPQL usavam parâmetros opcionais com a forma `(:filtro is null OR ...)`. No PostgreSQL/Hibernate 7, a listagem de equipamentos com `termo=null` gerava `function lower(bytea) does not exist`, pois o parâmetro nulo chegava sem tipo textual resolvido. As consultas de leitura também falhavam quando filtros de período/equipamento eram omitidos.

**Mudança:** trocamos os filtros opcionais de Equipamento, Plano, Leitura e Manutenção por Spring Data `Specification`. Cada predicado é incluído apenas quando o respectivo filtro tem valor. Isso remove a ambiguidade de tipo dos nulos e deixa a combinação de filtros explícita. Preservamos `EntityGraph` nas consultas paginadas que carregam associações usadas na resposta.

**Verificação feita:** `./mvnw -o -DskipTests compile` passou. A imagem `api` foi reconstruída e o serviço ficou saudável. Os GET de equipamentos, planos, leituras, manutenções e dashboard retornaram HTTP 200 diretamente na API; os quatro endpoints de lista também retornaram 200 passando pelo proxy do container `web`. O banco não foi recriado, então os dados de desenvolvimento foram preservados.

### Seed de demonstração — 2026-11-05

**Mudança:** criado `backend/src/main/resources/db/migration/V2__seed_demo.sql`.

**Motivo:** o avaliador (e o próprio vídeo de apresentação) precisa abrir a aplicação com dados reais que demonstrem as regras de negócio. Sem seed, o dashboard fica vazio e estados como VENCIDA/PRÓXIMA/EM DIA ficam invisíveis. Dados manuais inseridos via Swagger durante o desenvolvimento são voláteis e inconsistentes entre ambientes.

**O que o seed faz:**

1. `TRUNCATE manutencao, leitura_horimetro, plano_manutencao, equipamento RESTART IDENTITY CASCADE` — remove dados de desenvolvimento antes de inserir o seed. Roda apenas uma vez (Flyway controla).
2. Insere 15 equipamentos com estados variados:
   - **VENCIDOS (6 planos):** GRT-001 (2 planos para demonstrar múltiplos planos por equipamento), CPR-002, EMP-003, BTN-013, RMP-014.
   - **PRÓXIMOS (4 planos):** BBA-004, MTR-005, TRT-006, ARC-007 (restante ≤ antecedência em cada um).
   - **EM DIA (6 planos):** ESC-008, GNC-009, PFR-010, RET-011, VBR-012, BSB-015 (inativo).
   - **Status de equipamento:** 12 ATIVO, 2 EM_MANUTENCAO (BTN-013, RMP-014 — plano vencido acionou a intervenção), 1 INATIVO (BSB-015).
3. Insere histórico de leituras de horímetro (2–3 por equipamento).
4. Insere manutenções:
   - 5 CONCLUÍDAS (histórico preventivo e uma corretiva avulsa sem plano).
   - 1 CANCELADA (exemplo de cancelamento com observação).
   - 5 AGENDADAS com datas entre 06/11 e 11/11/2026, que aparecem no painel "Próximas manutenções" do dashboard.

**Comportamento do Flyway com seeds:**
- Cada migration roda **exatamente uma vez** — o Flyway registra a versão em `flyway_schema_history` e ignora nas próximas inicializações. Os 15 equipamentos **não se repetem** a cada `docker compose up`.
- Para reiniciar com dados limpos (ex.: antes de gravar o vídeo): `docker compose down -v && docker compose up --build`. O `-v` apaga o volume `pgdata`; o Flyway aplica V1 e V2 do zero.

**Decisão de design:** usar `SELECT id FROM equipamento WHERE codigo = 'XXX'` em vez de IDs numéricos fixos. Isso torna o seed independente da sequência real após o `RESTART IDENTITY` e sobrevive a futuros reordenamentos sem risco de FK quebrada.

**Verificação pendente:** `docker compose down -v && docker compose up --build` para confirmar que o Flyway aplica V1 + V2 sem erro e o dashboard exibe os KPIs e as manutenções agendadas.

---

### Correção do ENTRYPOINT do backend — 2026-11-05

**Mudança:** `backend/Dockerfile` linha 23 — adicionado `exec` antes do comando Java:

```dockerfile
# antes
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

# depois
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
```

**Motivo:** sem o `exec`, o processo PID 1 do container é o `sh`, não a JVM. O Docker envia `SIGTERM` ao PID 1 durante `docker compose stop` ou `down`. Como o `sh` não repassa sinais aos filhos, a JVM nunca recebe o aviso de parada — o Spring Boot não faz shutdown graceful (não drena requisições, não fecha conexões com o banco) e o Docker precisa aguardar o timeout (padrão 10 s) antes de matar o container à força com `SIGKILL`.

Com `exec`, o `sh` é **substituído** pela JVM (`execve` sobrescreve o processo), que se torna o PID 1. Ela recebe o `SIGTERM` diretamente e o Spring Boot encerra de forma limpa.

**Por que usar `["sh", "-c", "exec ..."]` em vez de `["java", ...]` direto:** a forma exec-array `ENTRYPOINT ["java", ...]` não expande variáveis de shell como `$JAVA_OPTS`. Manter o `sh -c` com `exec` preserva a expansão de variáveis e garante o repasse correto do sinal.

**Verificação:** `docker compose stop` deve encerrar o container `manutencao-api` em menos de 2 s com log `Stopped` (shutdown graceful do Spring Boot) em vez de aguardar os 10 s de timeout.

---

### Atualização de 2026-11-06 — seed com datas relativas, handler global e testes

**Seed (`V2__seed_demo.sql`):** as manutenções agendadas usavam datas fixas (06/11 a 11/11/2026), e a cancelada usava 28/10/2026. Se o avaliador rodasse o projeto depois dessas datas, o card "Próximas manutenções" e o KPI "Agendadas" apareceriam vazios. Agora as agendadas usam `CURRENT_DATE + 1` a `+ 6` (dentro da janela de 7 dias do dashboard) e a cancelada usa `CURRENT_DATE - 9`. As leituras já eram relativas (`now() - interval`).
- **Por que editar a V2 em vez de criar uma V3:** a V2 ainda não foi entregue, e o avaliador sempre começa com o banco vazio. Uma V3 de `UPDATE` deixaria o seed mais difícil de explicar. Como consequência, quem já tinha aplicado a V2 antiga precisa rodar `docker compose down -v`; senão o Flyway acusa divergência de checksum.

**Handler global (`shared/GlobalExceptionHandler`):** um `@RestControllerAdvice` que estende `ResponseEntityExceptionHandler`. Ao existir esse bean, o `ProblemDetailsExceptionHandler` automático do Boot deixa de ser registrado.
- **Validação (400):** o `detail` lista os campos inválidos, e a propriedade `errors` traz um mapa `{campo: mensagem}`. O padrão do Spring dizia apenas "Invalid request content". As mensagens seguem o `Accept-Language` do navegador (o Hibernate Validator tem tradução pt-BR).
- **`OptimisticLockingFailureException` → 409:** antes, só a leitura tratava esse caso; edições concorrentes de equipamento ou plano davam 500.
- **`DataIntegrityViolationException` → 409:** mensagem genérica para o cliente; a causa vai só para o log, sem expor SQL.
- **O que continua igual:** os `ResponseStatusException` dos services continuam funcionando, já que a classe base os converte em `ProblemDetail`. O frontend lê `detail` e não precisou mudar.

**Testes:** 12 → 20, todos passando com `./mvnw test` em 06/11.
- **Novos em `RegrasManutencaoIntegrationTest`:** leitura futura → 422; leitura igual ao horímetro atual → aceita; leitura em equipamento inativo → 422; agendar para plano inativo → 422; novo agendamento permitido após cancelar o anterior (índice parcial).
- **Novo `ErrosApiIntegrationTest` (MockMvc):** 400 com `errors.codigo` e `errors.horimetroInicial`, código duplicado → 409 com `detail`, e sem credenciais → 401.
- **Nota Boot 4:** `@AutoConfigureMockMvc` fica em `org.springframework.boot.webmvc.test.autoconfigure`.
- **Validação extra:** o contexto de teste aplica V1 e V2 num PostgreSQL limpo, o que confirma que o novo SQL do seed é válido.

**README:** login de demonstração indicado, seção sobre o seed e o `down -v`, instruções sem Docker corrigidas (o proxy do Vite já existia), testes e contrato de erros descritos.

**Ainda não validado:** `docker compose down -v && docker compose up --build` com a imagem nova e conferência visual do painel.

### Atualização de 2026-11-06 — ordenação da lista de manutenções

**Pedido do usuário:** escolher a ordem da lista. O padrão deve ser "prazo mais próximo"; antes a ordem era fixa em `dataAgendada,desc`, mostrando primeiro as datas mais distantes.

**Frontend (`ManutencoesPage.tsx`):** novo seletor "Ordenar por" ao lado do filtro de status, com 4 opções:
- **Prazo mais próximo** (`dataAgendada,asc`), o padrão. As agendadas em atraso aparecem primeiro, por serem as mais urgentes.
- **Prazo mais distante** (`dataAgendada,desc`).
- **Execução mais recente** (`dataExecucao,desc`).
- **Cadastro mais recente** (`criadoEm,desc`).

Detalhes da implementação:
- **Execução mais recente** só aparece em "Concluídas" e "Todas". Agendadas e canceladas não têm data de execução, e em ordem decrescente o PostgreSQL coloca os nulos primeiro. Se o status mudar e a ordem atual deixar de ser oferecida, a tela volta para o padrão.
- **Desempate:** toda requisição envia também `sort=id,asc`. Assim a paginação fica estável quando várias manutenções têm a mesma data (mesmo motivo da correção feita nos alertas).
- **Cache:** a ordem faz parte da `queryKey` do TanStack Query, então cada combinação de filtro e ordem tem seu próprio cache.

**Backend:** nenhuma mudança no endpoint, que já recebia `Pageable`. Foi adicionado `PropertyReferenceException` → 400 ("Ordenação inválida") no `GlobalExceptionHandler`; antes, `?sort=campoInexistente` gerava 500. No Spring Data 4 essa classe fica em `org.springframework.data.core` (no 3 ficava em `org.springframework.data.mapping`).

**Testes:** `ErrosApiIntegrationTest` ganhou dois testes.
- **Ordenação:** cria dados próprios, com o agendamento de prazo distante cadastrado antes do próximo, e filtra por `equipamentoId` para não depender do seed. Confere a ordem asc e desc.
- **Ordenação inválida:** confere o 400.

A suíte tem agora 22 testes, todos passando. `tsc -b` e ESLint da página passaram; a conferência visual no navegador ainda não foi feita.

### Atualização de 2026-11-06 — ações do Painel

**Componentes compartilhados:**
- **`features/leituras/RegistrarLeituraDialog.tsx`:** aceita `equipamentoId` e `horimetroAtual` opcionais. Mostra o horímetro atual e a data da última leitura, e limita a data/hora entre a última leitura e agora. Depois de salvar, exibe o **impacto** nos planos do equipamento (ex.: "Troca de óleo: Próxima → Vencida, 10 h de atraso"). Como faz: busca os planos antes de salvar, busca de novo depois e compara os status. O status continua calculado só pelo backend.
- **`features/manutencoes/AgendarManutencaoDialog.tsx`:** aceita `equipamentoId` e `planoId` opcionais e usa hoje como data padrão (`min` = hoje). Se o plano já tem manutenção `AGENDADA`, mostra um aviso com a data e desabilita a confirmação. O 409 do service e o índice parcial continuam sendo a garantia.
- **Uso:** as telas de Leituras e Manutenções passaram a usar esses componentes, o que removeu o código duplicado. Concluir e cancelar continuam na `ManutencoesPage`.

**Painel (`App.tsx`):**
- **Tabela:** usa `GET /api/v1/alertas?size=8`, com vencidas e próximas juntas e já ordenadas pelo backend (menor restante primeiro, desempate por id). Antes mostrava só as 5 vencidas de `dashboard/resumo.alertasCriticos`, então planos "Próximos" não tinham onde receber ação. O campo `alertasCriticos` continua na API, mas o frontend não o usa mais.
- **Ações por linha:** cada linha tem os botões "Leitura" e "Agendar", que abrem os diálogos já preenchidos.
- **KPIs:** Vencidas e Próximas viraram botões de alternância (`aria-pressed`) que filtram a tabela por `nivel`. Em dia e Agendadas continuam como links para as telas.
- **"Ver todos":** link para `/planos` quando há mais alertas que o limite exibido.
- **Topbar:** botão "+ Leitura", o atalho global do `telas.md`. No celular, aparece só o ícone.

**Correção de lint anterior:** o `App` chamava `setState` síncrono dentro do `useEffect` de autenticação (regra `react-hooks/set-state-in-effect`). Agora o estado inicial já vem de `possuiCredenciais()`, sem mudança de comportamento. `npm run lint` passa sem erros.

**Verificação feita:** `tsc -b`, `eslint src` e `npm run build` passaram. Pelo nginx, com o seed: `/alertas?size=8` devolve 10 no total (8 exibidos), `nivel=VENCIDA` devolve 6 e `nivel=PROXIMA` devolve 4. O plano da EMP-003 tem agendamento aberto, então o aviso aparece. Container `web` reconstruído. **A conferência visual ainda é do usuário.**

**Lacuna conhecida:** o backend aceita `dataAgendada` no passado; apenas o diálogo impede isso. Se for corrigir, a regra vai no `ManutencaoService.agendar` (422), com teste.
