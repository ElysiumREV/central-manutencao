-- =====================================================================
-- V2: seed de demonstração — Central de Monitoramento de Manutenção
-- =====================================================================
-- Limpa dados anteriores e popula 15 equipamentos para demonstração.
-- Esta migration é executada pelo Flyway UMA única vez. Nas próximas
-- inicializações o Flyway vê que V2 já foi aplicada e a ignora.
--
-- Para reiniciar com dados limpos (ex.: antes do vídeo):
--   docker compose down -v && docker compose up --build
-- =====================================================================

TRUNCATE manutencao, leitura_horimetro, plano_manutencao, equipamento
    RESTART IDENTITY CASCADE;

-- =====================================================================
-- 1. Equipamentos (15)
-- =====================================================================
-- Estado dos planos por grupo:
--   GRT-001, CPR-002, EMP-003, BTN-013, RMP-014 → planos VENCIDOS
--   BBA-004, MTR-005, TRT-006, ARC-007          → planos PRÓXIMOS
--   ESC-008, GNC-009, PFR-010, RET-011, VBR-012 → planos EM DIA
--   BTN-013, RMP-014 → status EM_MANUTENCAO (plano vencido gerou a intervenção)
--   BSB-015          → INATIVO (histórico preservado)

INSERT INTO equipamento (
    codigo, nome, tipo, fabricante, modelo,
    numero_serie, localizacao, status,
    horimetro_atual, data_ultima_leitura
) VALUES
-- planos VENCIDOS
('GRT-001', 'Gerador Principal',           'Gerador',          'Stemac',      'SG-250 kVA',
 'SG250-2021-001', 'Sala de Máquinas A',      'ATIVO',         2500.0, now() - interval '2 days'),
('CPR-002', 'Compressor de Ar Industrial', 'Compressor',       'Schulz',      'CSL-20 BR',
 'CSL20-2020-042', 'Oficina Central',         'ATIVO',         1800.0, now() - interval '1 day'),
('EMP-003', 'Empilhadeira Elétrica',       'Empilhadeira',     'Toyota',      '8FBN25',
 '8FBN25-2019-007','Armazém 1',               'ATIVO',         3200.0, now() - interval '3 hours'),

-- planos PRÓXIMOS DO VENCIMENTO
('BBA-004', 'Bomba Hidráulica 1',          'Bomba',            'KSB',         'Meganorm 50-200',
 'MGN50-2022-011', 'Subestação Norte',        'ATIVO',         1950.0, now() - interval '5 hours'),
('MTR-005', 'Motor Elétrico Secundário',   'Motor',            'WEG',         'W22 200L',
 'W22200-2021-033','Linha de Produção 2',     'ATIVO',          950.0, now() - interval '6 hours'),
('TRT-006', 'Trator de Pátio',             'Trator',           'John Deere',  '5075E',
 '5075E-2020-019', 'Pátio Externo',           'ATIVO',         4800.0, now() - interval '1 day'),
('ARC-007', 'Ar-Cond. Sala de Servidores', 'Ar Condicionado',  'Carrier',     '30XW-250',
 '30XW-2023-005',  'TI - Sala de Servidores', 'ATIVO',         1420.0, now() - interval '4 hours'),

-- planos EM DIA
('ESC-008', 'Escavadeira Hidráulica',      'Escavadeira',      'Caterpillar', '320D',
 '320D-2018-003',  'Obra Bloco B',            'ATIVO',         5100.0, now() - interval '2 days'),
('GNC-009', 'Guincho Elétrico 5 t',        'Guincho',          'Demag',       'DCM 5',
 'DCM5-2022-002',  'Galpão Industrial',       'ATIVO',          800.0, now() - interval '3 days'),
('PFR-010', 'Perfuratriz Rotativa',        'Perfuratriz',      'Atlas Copco', 'ROC L8',
 'ROCL8-2019-014', 'Área de Perfuração',      'ATIVO',         2200.0, now() - interval '1 day'),
('RET-011', 'Retroescavadeira',            'Retroescavadeira', 'JCB',         '3CX',
 '3CX-2020-025',   'Obra Bloco A',            'ATIVO',         1500.0, now() - interval '5 days'),
('VBR-012', 'Vibrador de Concreto',        'Vibrador',         'Bosch',       'GVC 30 E',
 'GVC30-2023-008', 'Obra Bloco C',            'ATIVO',          600.0, now() - interval '2 hours'),

-- em manutenção (plano vencido acionou a intervenção)
('BTN-013', 'Betoneira Industrial',        'Betoneira',        'Menegotti',   'MC-320',
 'MC320-2021-016', 'Obra Bloco B',            'EM_MANUTENCAO', 1200.0, now() - interval '7 days'),
('RMP-014', 'Rompedor Hidráulico',         'Rompedor',         'Sandvik',     'BR2577',
 'BR2577-2019-009','Área de Demolição',       'EM_MANUTENCAO', 3800.0, now() - interval '10 days'),

-- inativo (histórico preservado; equipamento encerrado)
('BSB-015', 'Bomba Submersível Poço 2',    'Bomba',            'Grundfos',    'SP 17-18',
 'SP17-2017-003',  'Poço Artesiano 2',        'INATIVO',       7200.0, now() - interval '30 days');


-- =====================================================================
-- 2. Planos de manutenção
-- =====================================================================
-- Regra do CHECK do banco: proximo_vencimento = horimetro_ultima_execucao + intervalo_horas
-- A tabela a seguir resume os estados de alerta calculados:
--
-- Equip.   | intervalo | antecedencia | ultima_exec | proximo_venc | horim_atual | restante | status
-- GRT-001  |   250     |    50        |   2000      |   2250       |   2500      |  -250    | VENCIDA
-- GRT-001* |   500     |    80        |   2000      |   2500       |   2500      |     0    | VENCIDA
-- CPR-002  |   200     |    40        |   1500      |   1700       |   1800      |  -100    | VENCIDA
-- EMP-003  |   300     |    60        |   2900      |   3200       |   3200      |     0    | VENCIDA
-- BBA-004  |   300     |   100        |   1700      |   2000       |   1950      |    50    | PROXIMA
-- MTR-005  |   500     |   100        |    500      |   1000       |    950      |    50    | PROXIMA
-- TRT-006  |   250     |    80        |   4600      |   4850       |   4800      |    50    | PROXIMA
-- ARC-007  |   250     |    50        |   1200      |   1450       |   1420      |    30    | PROXIMA
-- ESC-008  |   500     |   100        |   4800      |   5300       |   5100      |   200    | EM_DIA
-- GNC-009  |   400     |    80        |    600      |   1000       |    800      |   200    | EM_DIA
-- PFR-010  |   500     |   100        |   2000      |   2500       |   2200      |   300    | EM_DIA
-- RET-011  |   600     |   120        |   1200      |   1800       |   1500      |   300    | EM_DIA
-- VBR-012  |   300     |    60        |    400      |    700       |    600      |   100    | EM_DIA
-- BTN-013  |   400     |    80        |    800      |   1200       |   1200      |     0    | VENCIDA
-- RMP-014  |   300     |    60        |   3500      |   3800       |   3800      |     0    | VENCIDA
-- BSB-015  |  1000     |   200        |   6500      |   7500       |   7200      |   300    | EM_DIA (inativo)
--
-- * GRT-001 tem dois planos para demonstrar múltiplos planos por equipamento.

-- GRT-001: dois planos (demonstra equipamento com múltiplos planos vencidos)
INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Troca de óleo e filtros', 250.0, 50.0, 2000.0, 2250.0, true FROM equipamento WHERE codigo = 'GRT-001';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Revisão completa', 500.0, 80.0, 2000.0, 2500.0, true FROM equipamento WHERE codigo = 'GRT-001';

-- demais equipamentos: um plano cada
INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Lubrificação e ajuste de válvulas', 200.0, 40.0, 1500.0, 1700.0, true FROM equipamento WHERE codigo = 'CPR-002';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Revisão preventiva geral', 300.0, 60.0, 2900.0, 3200.0, true FROM equipamento WHERE codigo = 'EMP-003';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Manutenção preventiva', 300.0, 100.0, 1700.0, 2000.0, true FROM equipamento WHERE codigo = 'BBA-004';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Revisão de rolamentos e lubrificação', 500.0, 100.0, 500.0, 1000.0, true FROM equipamento WHERE codigo = 'MTR-005';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Manutenção completa', 250.0, 80.0, 4600.0, 4850.0, true FROM equipamento WHERE codigo = 'TRT-006';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Limpeza e troca de filtros', 250.0, 50.0, 1200.0, 1450.0, true FROM equipamento WHERE codigo = 'ARC-007';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Revisão geral e troca de fluidos', 500.0, 100.0, 4800.0, 5300.0, true FROM equipamento WHERE codigo = 'ESC-008';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Lubrificação de cabo e freio', 400.0, 80.0, 600.0, 1000.0, true FROM equipamento WHERE codigo = 'GNC-009';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Troca de brocas e inspeção', 500.0, 100.0, 2000.0, 2500.0, true FROM equipamento WHERE codigo = 'PFR-010';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Revisão do sistema hidráulico', 600.0, 120.0, 1200.0, 1800.0, true FROM equipamento WHERE codigo = 'RET-011';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Verificação de agulha e mangote', 300.0, 60.0, 400.0, 700.0, true FROM equipamento WHERE codigo = 'VBR-012';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Revisão do motor e tambor', 400.0, 80.0, 800.0, 1200.0, true FROM equipamento WHERE codigo = 'BTN-013';

INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Verificação do sistema hidráulico', 300.0, 60.0, 3500.0, 3800.0, true FROM equipamento WHERE codigo = 'RMP-014';

-- BSB-015: plano inativo (equipamento encerrado; plano desativado junto)
INSERT INTO plano_manutencao (equipamento_id, nome, intervalo_horas, antecedencia_alerta_horas, horimetro_ultima_execucao, proximo_vencimento, ativo)
SELECT id, 'Revisão da bomba e selo mecânico', 1000.0, 200.0, 6500.0, 7500.0, false FROM equipamento WHERE codigo = 'BSB-015';


-- =====================================================================
-- 3. Leituras de horímetro (histórico por equipamento)
-- =====================================================================

INSERT INTO leitura_horimetro (equipamento_id, valor, data_hora, responsavel, observacao)
-- GRT-001
SELECT id, 2000.0, now() - interval '90 days',  'Carlos Souza', 'Leitura pós-manutenção' FROM equipamento WHERE codigo = 'GRT-001'
UNION ALL
SELECT id, 2250.0, now() - interval '45 days',  'Carlos Souza', NULL FROM equipamento WHERE codigo = 'GRT-001'
UNION ALL
SELECT id, 2500.0, now() - interval '2 days',   'Carlos Souza', 'Horímetro vencido – agendar revisão' FROM equipamento WHERE codigo = 'GRT-001'
-- CPR-002
UNION ALL
SELECT id, 1500.0, now() - interval '60 days',  'Ana Lima', 'Leitura pós-manutenção' FROM equipamento WHERE codigo = 'CPR-002'
UNION ALL
SELECT id, 1700.0, now() - interval '30 days',  'Ana Lima', NULL FROM equipamento WHERE codigo = 'CPR-002'
UNION ALL
SELECT id, 1800.0, now() - interval '1 day',    'Ana Lima', 'Plano de lubrificação vencido' FROM equipamento WHERE codigo = 'CPR-002'
-- EMP-003
UNION ALL
SELECT id, 2900.0, now() - interval '30 days',  'Roberto Maia', 'Leitura pós-manutenção' FROM equipamento WHERE codigo = 'EMP-003'
UNION ALL
SELECT id, 3200.0, now() - interval '3 hours',  'Roberto Maia', 'No limite do vencimento – manutenção agendada' FROM equipamento WHERE codigo = 'EMP-003'
-- BBA-004
UNION ALL
SELECT id, 1700.0, now() - interval '45 days',  'Fernanda Costa', 'Leitura pós-manutenção' FROM equipamento WHERE codigo = 'BBA-004'
UNION ALL
SELECT id, 1950.0, now() - interval '5 hours',  'Fernanda Costa', 'Faltam 50 h para o vencimento' FROM equipamento WHERE codigo = 'BBA-004'
-- MTR-005
UNION ALL
SELECT id,  500.0, now() - interval '120 days', 'Paulo Neves', 'Leitura inicial após manutenção' FROM equipamento WHERE codigo = 'MTR-005'
UNION ALL
SELECT id,  950.0, now() - interval '6 hours',  'Paulo Neves', 'Próximo do vencimento' FROM equipamento WHERE codigo = 'MTR-005'
-- TRT-006
UNION ALL
SELECT id, 4600.0, now() - interval '30 days',  'Marcos Alves', 'Leitura pós-revisão' FROM equipamento WHERE codigo = 'TRT-006'
UNION ALL
SELECT id, 4800.0, now() - interval '1 day',    'Marcos Alves', NULL FROM equipamento WHERE codigo = 'TRT-006'
-- ARC-007
UNION ALL
SELECT id, 1200.0, now() - interval '60 days',  'Carla Pinto', 'Leitura pós-troca de filtros' FROM equipamento WHERE codigo = 'ARC-007'
UNION ALL
SELECT id, 1420.0, now() - interval '4 hours',  'Carla Pinto', 'Dentro da faixa de alerta' FROM equipamento WHERE codigo = 'ARC-007'
-- ESC-008
UNION ALL
SELECT id, 4800.0, now() - interval '50 days',  'Diego Ferreira', 'Leitura pós-revisão geral' FROM equipamento WHERE codigo = 'ESC-008'
UNION ALL
SELECT id, 5100.0, now() - interval '2 days',   'Diego Ferreira', NULL FROM equipamento WHERE codigo = 'ESC-008'
-- GNC-009
UNION ALL
SELECT id,  600.0, now() - interval '90 days',  'Isabela Rocha', 'Leitura pós-manutenção' FROM equipamento WHERE codigo = 'GNC-009'
UNION ALL
SELECT id,  800.0, now() - interval '3 days',   'Isabela Rocha', NULL FROM equipamento WHERE codigo = 'GNC-009'
-- PFR-010
UNION ALL
SELECT id, 2000.0, now() - interval '35 days',  'Thiago Barros', 'Leitura pós-troca de brocas' FROM equipamento WHERE codigo = 'PFR-010'
UNION ALL
SELECT id, 2200.0, now() - interval '1 day',    'Thiago Barros', NULL FROM equipamento WHERE codigo = 'PFR-010'
-- RET-011
UNION ALL
SELECT id, 1200.0, now() - interval '60 days',  'Luana Santos', 'Leitura pós-revisão hidráulica' FROM equipamento WHERE codigo = 'RET-011'
UNION ALL
SELECT id, 1500.0, now() - interval '5 days',   'Luana Santos', NULL FROM equipamento WHERE codigo = 'RET-011'
-- VBR-012
UNION ALL
SELECT id,  400.0, now() - interval '45 days',  'Rafael Dias', 'Leitura pós-verificação' FROM equipamento WHERE codigo = 'VBR-012'
UNION ALL
SELECT id,  600.0, now() - interval '2 hours',  'Rafael Dias', NULL FROM equipamento WHERE codigo = 'VBR-012'
-- BTN-013
UNION ALL
SELECT id,  800.0, now() - interval '120 days', 'Gustavo Lima', 'Leitura pós-revisão do motor' FROM equipamento WHERE codigo = 'BTN-013'
UNION ALL
SELECT id, 1200.0, now() - interval '7 days',   'Gustavo Lima', 'Plano vencido – equipamento parado para manutenção' FROM equipamento WHERE codigo = 'BTN-013'
-- RMP-014
UNION ALL
SELECT id, 3500.0, now() - interval '40 days',  'Beatriz Nunes', 'Leitura pós-verificação hidráulica' FROM equipamento WHERE codigo = 'RMP-014'
UNION ALL
SELECT id, 3800.0, now() - interval '10 days',  'Beatriz Nunes', 'Vencido – equipamento parado para manutenção' FROM equipamento WHERE codigo = 'RMP-014'
-- BSB-015
UNION ALL
SELECT id, 6500.0, now() - interval '180 days', 'Operação', 'Última manutenção antes da inativação' FROM equipamento WHERE codigo = 'BSB-015'
UNION ALL
SELECT id, 7200.0, now() - interval '30 days',  'Operação', 'Leitura final antes do encerramento do equipamento' FROM equipamento WHERE codigo = 'BSB-015';


-- =====================================================================
-- 4. Manutenções
-- =====================================================================

-- ---------------------------------------------------------------------
-- 4a. CONCLUÍDAS — histórico de execuções preventivas e corretivas
-- ---------------------------------------------------------------------

INSERT INTO manutencao (equipamento_id, plano_id, tipo, status, data_execucao, horimetro_execucao, responsavel, observacoes)
-- GRT-001: última troca de óleo (completou o ciclo atual do plano)
SELECT e.id, p.id, 'PREVENTIVA', 'CONCLUIDA',
       now() - interval '90 days', 2000.0,
       'Carlos Souza', 'Troca de óleo 15W-40 e filtro. Verificação de tensão da correia. Sem anomalias.'
  FROM equipamento e
  JOIN plano_manutencao p ON p.equipamento_id = e.id AND p.nome = 'Troca de óleo e filtros'
 WHERE e.codigo = 'GRT-001'

UNION ALL
-- ESC-008: última revisão geral
SELECT e.id, p.id, 'PREVENTIVA', 'CONCLUIDA',
       now() - interval '50 days', 4800.0,
       'Diego Ferreira', 'Revisão geral concluída. Troca de fluido hidráulico e filtros. Sistema em boas condições.'
  FROM equipamento e
  JOIN plano_manutencao p ON p.equipamento_id = e.id
 WHERE e.codigo = 'ESC-008'

UNION ALL
-- PFR-010: última troca de brocas
SELECT e.id, p.id, 'PREVENTIVA', 'CONCLUIDA',
       now() - interval '35 days', 2000.0,
       'Thiago Barros', 'Troca de brocas e lubrificação do sistema rotativo. Verificação de folgas.'
  FROM equipamento e
  JOIN plano_manutencao p ON p.equipamento_id = e.id
 WHERE e.codigo = 'PFR-010'

UNION ALL
-- RET-011: última revisão hidráulica
SELECT e.id, p.id, 'PREVENTIVA', 'CONCLUIDA',
       now() - interval '60 days', 1200.0,
       'Luana Santos', 'Revisão hidráulica completa. Troca de mangueiras e fluido. Pressão normalizada.'
  FROM equipamento e
  JOIN plano_manutencao p ON p.equipamento_id = e.id
 WHERE e.codigo = 'RET-011'

UNION ALL
-- CPR-002: corretiva avulsa (falha operacional, sem plano)
SELECT e.id, NULL, 'CORRETIVA', 'CONCLUIDA',
       now() - interval '20 days', 1750.0,
       'Manutenção Urgente', 'Substituição de válvula de retenção por falha operacional. Causa: desgaste prematuro.'
  FROM equipamento e
 WHERE e.codigo = 'CPR-002';


-- ---------------------------------------------------------------------
-- 4b. CANCELADA — exemplo de manutenção cancelada
-- ---------------------------------------------------------------------

INSERT INTO manutencao (equipamento_id, plano_id, tipo, status, data_agendada, responsavel, observacoes)
SELECT e.id, NULL, 'CORRETIVA', 'CANCELADA',
       '2026-10-28', 'Coordenação de Manutenção',
       'Manutenção corretiva cancelada – ruído identificado como normal de operação após inspeção.'
  FROM equipamento e
 WHERE e.codigo = 'GNC-009';


-- ---------------------------------------------------------------------
-- 4c. AGENDADAS — aparecem no painel "Próximas manutenções" (7 dias)
-- ---------------------------------------------------------------------
-- Datas entre 2026-11-05 e 2026-11-12; índice único garante um
-- agendamento aberto por plano (ux_manutencao_plano_agendada).

INSERT INTO manutencao (equipamento_id, plano_id, tipo, status, data_agendada, responsavel, observacoes)
SELECT e.id, p.id, 'PREVENTIVA', 'AGENDADA',
       '2026-11-06', 'Gustavo Lima',
       'Revisão do motor e tambor. Equipamento parado para manutenção.'
  FROM equipamento e
  JOIN plano_manutencao p ON p.equipamento_id = e.id
 WHERE e.codigo = 'BTN-013';

INSERT INTO manutencao (equipamento_id, plano_id, tipo, status, data_agendada, responsavel, observacoes)
SELECT e.id, p.id, 'PREVENTIVA', 'AGENDADA',
       '2026-11-07', 'Roberto Maia',
       'Revisão preventiva geral. Plano vencido – prioridade alta.'
  FROM equipamento e
  JOIN plano_manutencao p ON p.equipamento_id = e.id
 WHERE e.codigo = 'EMP-003';

INSERT INTO manutencao (equipamento_id, plano_id, tipo, status, data_agendada, responsavel, observacoes)
SELECT e.id, p.id, 'PREVENTIVA', 'AGENDADA',
       '2026-11-08', 'Beatriz Nunes',
       'Verificação do sistema hidráulico. Equipamento em parada programada.'
  FROM equipamento e
  JOIN plano_manutencao p ON p.equipamento_id = e.id
 WHERE e.codigo = 'RMP-014';

INSERT INTO manutencao (equipamento_id, plano_id, tipo, status, data_agendada, responsavel, observacoes)
SELECT e.id, p.id, 'PREVENTIVA', 'AGENDADA',
       '2026-11-09', 'Fernanda Costa',
       'Manutenção preventiva agendada antes do vencimento. Faltam 50 h.'
  FROM equipamento e
  JOIN plano_manutencao p ON p.equipamento_id = e.id
 WHERE e.codigo = 'BBA-004';

INSERT INTO manutencao (equipamento_id, plano_id, tipo, status, data_agendada, responsavel, observacoes)
SELECT e.id, p.id, 'PREVENTIVA', 'AGENDADA',
       '2026-11-11', 'Marcos Alves',
       'Manutenção completa do trator. Reserva de técnico e peças confirmada.'
  FROM equipamento e
  JOIN plano_manutencao p ON p.equipamento_id = e.id
 WHERE e.codigo = 'TRT-006';
