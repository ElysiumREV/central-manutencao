-- =====================================================================
-- V1: schema inicial da Central de Monitoramento de Manutenção Preventiva
-- Horas: NUMERIC(10,1) | Datas: TIMESTAMPTZ | Enums: VARCHAR + CHECK
-- =====================================================================

-- ---------------------------------------------------------------------
-- equipamento
-- ---------------------------------------------------------------------
CREATE TABLE equipamento (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo              VARCHAR(50)  NOT NULL,
    nome                VARCHAR(150) NOT NULL,
    tipo                VARCHAR(80)  NOT NULL,
    fabricante          VARCHAR(100),
    modelo              VARCHAR(100),
    numero_serie        VARCHAR(100),
    localizacao         VARCHAR(150),
    status              VARCHAR(20)  NOT NULL DEFAULT 'ATIVO',
    horimetro_atual     NUMERIC(10,1) NOT NULL DEFAULT 0,
    data_ultima_leitura TIMESTAMPTZ,
    version             BIGINT       NOT NULL DEFAULT 0,
    criado_em           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uk_equipamento_codigo     UNIQUE (codigo),
    CONSTRAINT ck_equipamento_status     CHECK (status IN ('ATIVO', 'EM_MANUTENCAO', 'INATIVO')),
    CONSTRAINT ck_equipamento_horimetro  CHECK (horimetro_atual >= 0)
);

-- ---------------------------------------------------------------------
-- plano_manutencao
-- proximo_vencimento = horimetro_ultima_execucao + intervalo_horas
-- (calculado pelo Service; o CHECK garante a consistência no banco)
-- ---------------------------------------------------------------------
CREATE TABLE plano_manutencao (
    id                         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    equipamento_id             BIGINT        NOT NULL REFERENCES equipamento (id),
    nome                       VARCHAR(120)  NOT NULL,
    intervalo_horas            NUMERIC(10,1) NOT NULL,
    antecedencia_alerta_horas  NUMERIC(10,1) NOT NULL DEFAULT 0,
    horimetro_ultima_execucao  NUMERIC(10,1) NOT NULL DEFAULT 0,
    proximo_vencimento         NUMERIC(10,1) NOT NULL,
    ativo                      BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em                  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    atualizado_em              TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT ck_plano_intervalo     CHECK (intervalo_horas > 0),
    CONSTRAINT ck_plano_antecedencia  CHECK (antecedencia_alerta_horas >= 0
                                             AND antecedencia_alerta_horas < intervalo_horas),
    CONSTRAINT ck_plano_ultima_exec   CHECK (horimetro_ultima_execucao >= 0),
    CONSTRAINT ck_plano_vencimento    CHECK (proximo_vencimento = horimetro_ultima_execucao + intervalo_horas)
);

-- ---------------------------------------------------------------------
-- leitura_horimetro
-- ---------------------------------------------------------------------
CREATE TABLE leitura_horimetro (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    equipamento_id  BIGINT        NOT NULL REFERENCES equipamento (id),
    valor           NUMERIC(10,1) NOT NULL,
    data_hora       TIMESTAMPTZ   NOT NULL,
    responsavel     VARCHAR(120)  NOT NULL,
    observacao      VARCHAR(500),
    criado_em       TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT ck_leitura_valor CHECK (valor >= 0)
);

-- ---------------------------------------------------------------------
-- manutencao
-- plano_id é opcional (corretiva avulsa)
-- ---------------------------------------------------------------------
CREATE TABLE manutencao (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    equipamento_id      BIGINT        NOT NULL REFERENCES equipamento (id),
    plano_id            BIGINT        REFERENCES plano_manutencao (id),
    tipo                VARCHAR(20)   NOT NULL,
    status              VARCHAR(20)   NOT NULL DEFAULT 'AGENDADA',
    data_agendada       DATE,
    data_execucao       TIMESTAMPTZ,
    horimetro_execucao  NUMERIC(10,1),
    responsavel         VARCHAR(120),
    observacoes         TEXT,
    criado_em           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT ck_manutencao_tipo      CHECK (tipo IN ('PREVENTIVA', 'CORRETIVA')),
    CONSTRAINT ck_manutencao_status    CHECK (status IN ('AGENDADA', 'CONCLUIDA', 'CANCELADA')),
    CONSTRAINT ck_manutencao_horimetro CHECK (horimetro_execucao IS NULL OR horimetro_execucao >= 0),
    CONSTRAINT ck_manutencao_agendada  CHECK (status <> 'AGENDADA' OR data_agendada IS NOT NULL),
    CONSTRAINT ck_manutencao_concluida CHECK (status <> 'CONCLUIDA'
                                              OR (data_execucao IS NOT NULL AND horimetro_execucao IS NOT NULL))
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
CREATE INDEX ix_plano_equipamento_ativo   ON plano_manutencao (equipamento_id, ativo);
CREATE INDEX ix_plano_proximo_vencimento  ON plano_manutencao (proximo_vencimento);

CREATE INDEX ix_leitura_equipamento_data  ON leitura_horimetro (equipamento_id, data_hora DESC);

CREATE INDEX ix_manutencao_status_data    ON manutencao (status, data_agendada);
CREATE INDEX ix_manutencao_equipamento    ON manutencao (equipamento_id);
CREATE INDEX ix_manutencao_plano          ON manutencao (plano_id);

-- No máximo um agendamento aberto por plano
CREATE UNIQUE INDEX ux_manutencao_plano_agendada
    ON manutencao (plano_id)
    WHERE status = 'AGENDADA';
