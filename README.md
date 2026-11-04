# Central de Monitoramento de Manutenção Preventiva

Aplicação web para acompanhar manutenção preventiva de equipamentos com base no horímetro. O sistema registra equipamentos, planos, leituras e manutenções; calcula alertas de vencimento e exibe um painel operacional.

## Tecnologias

- **Backend:** Java 21, Spring Boot 4, Spring Security, Spring Data JPA, Flyway e Springdoc OpenAPI.
- **Frontend:** React, TypeScript, Vite, React Router, TanStack Query e Material UI.
- **Banco:** PostgreSQL 16.
- **Execução local:** Docker Compose e Nginx como proxy de `/api` para o backend.

## Executar com Docker

Pré-requisito: Docker com o plugin Compose.

```bash
docker compose up --build -d
```

Abra:

- Frontend: <http://localhost:3000>
- Swagger UI: <http://localhost:8080/swagger-ui.html>
- Healthcheck: <http://localhost:8080/actuator/health>

O Compose usa credenciais de demonstração locais. Para alterá-las, defina `APP_AUTH_USERNAME` e `APP_AUTH_PASSWORD` no ambiente ou no arquivo `.env` antes de iniciar os serviços. Não use os valores de demonstração fora do ambiente local. O login do frontend usa HTTP Basic; a página solicita autenticação novamente após recarregar.

Para acompanhar os serviços:

```bash
docker compose ps
docker compose logs -f api
```

Para parar sem apagar os dados do banco:

```bash
docker compose down
```

O volume `pgdata` guarda os dados do PostgreSQL. `docker compose down -v` também apaga esse volume.

## Executar sem Docker

É necessário PostgreSQL 16, JDK 21 e Node.js compatível com o Vite usado pelo projeto.

Configure `DB_URL`, `DB_USER`, `DB_PASSWORD`, `APP_AUTH_USERNAME` e `APP_AUTH_PASSWORD` no ambiente do backend. As migrations Flyway são executadas na inicialização.

```bash
cd backend
./mvnw spring-boot:run
```

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

No modo Vite, configure o proxy local da API conforme `frontend/vite.config.ts`, ou use Docker Compose, que fornece o proxy Nginx.

## Funcionalidades

- Cadastro, edição, busca, filtros e inativação lógica de equipamentos.
- Planos preventivos associados a equipamentos, com intervalo e antecedência de alerta.
- Registro e histórico de leituras de horímetro.
- Cálculo de planos vencidos, próximos do vencimento e em dia.
- Agendamento, conclusão e cancelamento de manutenções.
- Dashboard com indicadores, alertas críticos e próximas manutenções.
- Autenticação HTTP Basic para as rotas de negócio.

## Regras principais

- **Próximo vencimento:** horímetro da última execução + intervalo do plano.
- **Vencida:** horímetro atual igual ou maior que o próximo vencimento.
- **Próxima:** ainda não venceu e faltam horas menores ou iguais à antecedência configurada.
- Uma leitura não pode ter valor menor que o horímetro atual nem data anterior à leitura mais recente.
- A edição da configuração de um plano não altera seu horímetro de última execução. Esse valor é atualizado ao concluir uma manutenção preventiva.
- Uma preventiva exige plano ativo; o banco também impede agendamentos duplicados para o mesmo plano.
- Inativar equipamento preserva o histórico.

## Testes

O backend possui testes unitários do cálculo e do ciclo do plano, além de testes de integração com PostgreSQL via Testcontainers. Docker precisa estar disponível para a suíte de integração.

```bash
cd backend
./mvnw test
```

Build do frontend:

```bash
cd frontend
npm ci
npm run build
```

## Organização

O backend é organizado por funcionalidade (`equipamento`, `plano`, `leitura`, `manutencao`, `alerta`, `dashboard` e `seguranca`). Entidades concentram operações de domínio; Services aplicam regras transacionais; Controllers expõem DTOs REST. O schema é versionado em `backend/src/main/resources/db/migration`.

O frontend separa as páginas por funcionalidade em `frontend/src/features`; `frontend/src/api/http.ts` centraliza chamadas REST e autenticação.

Mais contexto e decisões estão em [`docs/contexto-para-llm.md`](docs/contexto-para-llm.md), no [modelo de dados](docs/modelo-de-dados.md) e nas [telas](docs/telas.md).

## Segurança e escopo

A autenticação atual usa um único usuário em memória, configurável por ambiente. É adequada à demonstração local do desafio, sem cadastro de usuários ou autorização por papéis. HTTP Basic não criptografa o transporte: qualquer implantação externa deve usar HTTPS e credenciais próprias. O healthcheck e os recursos do Swagger ficam públicos; chamadas aos endpoints de negócio exigem autenticação.

## Próximas melhorias

- README screenshots e roteiro/vídeo de apresentação.
- Seed demonstrativo e teste completo do fluxo operacional.
- Persistência e administração de usuários, autorização por papéis e HTTPS em implantação.
- Testes de componentes e geração dos tipos TypeScript a partir do OpenAPI.
