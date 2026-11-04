# Inventário de telas

Documento de referência para wireframes (Figma) e backlog do frontend.

## Mapa de navegação

| Rota | Tela | Figma |
|---|---|---|
| `/` | Painel de monitoramento | **Alta fidelidade** |
| `/equipamentos` | Lista de equipamentos | Baixa |
| `/equipamentos/novo`, `/equipamentos/:id/editar` | Formulário de equipamento | Baixa |
| `/equipamentos/:id` | Detalhe do equipamento (abas) | **Alta fidelidade** |
| `/planos` | Lista de planos (visão global) | Baixa |
| `/leituras` | Histórico de leituras (visão global) | Baixa |
| `/manutencoes` | Lista e agenda de manutenções | Baixa |
| Diálogos | Registrar leitura, Plano, Agendar/Registrar, Concluir, Cancelar | **Leitura em alta**, demais em baixa |

**Decisão de escopo:** não há tela separada de Alertas. O painel já é a tabela de alertas, com filtros.

## Layout global

- **Sidebar:** Painel, Equipamentos, Planos, Leituras, Manutenções. No celular vira drawer.
- **Topbar:** título da página e botão **+ Leitura** (atalho global).
- **Feedback:** toasts de sucesso/erro; diálogo de confirmação para ações destrutivas.
- **Formatação:** horas em pt-BR (`1.510,5 h`); datas `dd/MM/yyyy HH:mm`.

---

## 1. Painel (`/`)

**Objetivo:** em 5 segundos, saber o que exige ação.

- **KPIs (clicáveis, filtram a tabela):** Vencidas, Próximas, Em dia, Agendadas (próximos 7 dias).
- **Tabela de alertas:** Equipamento (TAG + nome), Plano, Horímetro atual, Vencimento, Restante (`-10 h` / `20 h`), Status (badge com ícone e texto), ações.
- **Filtros:** nível (vencida/próxima), tipo de equipamento, busca por TAG ou nome. Ordenação padrão: mais atrasado primeiro.
- **Ações por linha:** Registrar leitura, Agendar manutenção, Ver equipamento.
- **Cards laterais:** Próximas agendadas (data, equipamento, plano). Opcional: Sem leitura há mais de 7 dias.
- **Estados:** skeleton nos KPIs e na tabela; vazio positivo ("Nenhum alerta. Tudo em dia."); erro com "Tentar novamente".
- **API:** `GET /dashboard/resumo`, `GET /alertas`.
- **Mobile:** KPIs em grade 2x2; linhas da tabela viram cards.

## 2. Equipamentos: lista

- **Colunas:** TAG, Nome, Tipo, Localização, Status, Horímetro atual, Pior status de plano (badge).
- **Filtros:** busca, status, tipo. Paginação no servidor.
- **Ações:** Novo, Editar, Inativar (com confirmação). Clique na linha abre o detalhe.
- **Estados:** vazio com CTA "Cadastrar primeiro equipamento".
- **API:** `GET /equipamentos`, `DELETE /equipamentos/{id}` (inativa).

## 3. Equipamentos: formulário

| Campo | Regra |
|---|---|
| TAG/código | Obrigatório, único (erro 409 aparece no campo) |
| Nome | Obrigatório |
| Tipo | Obrigatório |
| Fabricante, modelo, nº de série, localização | Opcionais |
| Status | Ativo / Em manutenção / Inativo |
| Horímetro inicial | Obrigatório, ≥ 0, **somente na criação**. Depois, só muda por leitura |

## 4. Equipamentos: detalhe

- **Cabeçalho:** TAG, nome, chip de status, **horímetro atual em destaque** e data da última leitura. Ações: Registrar leitura, Agendar, Editar, Inativar.
- **Aba Planos:** um card por plano com barra de progresso (% do intervalo consumido, na cor do semáforo), horas restantes, vencimento e status. Ações: editar, ativar/desativar, agendar. Botão "Novo plano".
- **Aba Leituras:** tabela (data, valor, responsável, observação). Opcional: gráfico de linha do horímetro.
- **Aba Manutenções:** histórico com tipo, status, datas e horímetro na execução.
- **Aba Dados:** informações cadastrais.
- **API:** `GET /equipamentos/{id}/resumo`, `/planos?equipamentoId=`, `/equipamentos/{id}/leituras`, `/manutencoes?equipamentoId=`.

## 5. Planos (visão global e diálogo)

- **Lista:** Equipamento, Plano, Intervalo, Antecedência, Último horímetro de execução, Próximo vencimento, Status, Ativo. Filtros por equipamento, status e ativo.
- **Diálogo de plano:**
  - Equipamento (pré-preenchido quando vem do detalhe)
  - Nome
  - Intervalo (h, > 0)
  - Antecedência de alerta (h, ≥ 0 e menor que o intervalo)
  - Na criação: horímetro inicial do ciclo (≤ horímetro atual). Na edição: exibir o horímetro registrado como somente leitura; somente concluir uma manutenção preventiva atualiza esse valor.
  - Ativo
- **Apoio ao vivo:** texto "Próximo vencimento: **1.500 h**" enquanto o usuário digita o intervalo e o horímetro inicial (apenas na criação).
- **Decisão:** planos são criados dentro do detalhe do equipamento; a tela global serve para consulta e edição rápida.

## 6. Leituras

- **Lista global:** Data/hora, Equipamento, Valor, Responsável, Observação. Filtros por equipamento e período.
- **Diálogo Registrar leitura** (fluxo mais importante do sistema):
  - Equipamento (autocomplete, pré-preenchido quando possível), com linha de apoio "Última leitura: 1.480 h em 20/10".
  - Valor (não pode ser menor que o último), data/hora (padrão agora, não pode ser futura), responsável, observação.
  - Ao salvar, o toast mostra o **impacto**: "Plano Troca de óleo passou a VENCIDA".
  - Erros inline (422) para valor menor que o anterior e equipamento inativo.
- **API:** `POST /equipamentos/{id}/leituras`.

## 7. Manutenções

- **Lista:** Data agendada, Equipamento, Plano, Tipo, Status, Responsável. Filtros por status, equipamento e período. Visão alternativa em agenda simples (agrupada por semana).
- **Diálogo Agendar/Registrar:** seletor "Agendar" ou "Registrar já realizada". Campos: equipamento, plano (opcional, filtrado pelo equipamento), tipo, data, responsável, observações. Bloqueia plano inativo e agendamento duplicado.
- **Diálogo Concluir:** data de execução, **horímetro na execução** (sugere o atual) e observações. Mostra "Próximo vencimento passará a ser **1.750 h**" antes de confirmar.
- **Diálogo Cancelar:** motivo opcional e confirmação.
- **API:** `GET/POST /manutencoes`, `POST /manutencoes/{id}/concluir`, `POST /manutencoes/{id}/cancelar`.

---

## Componentes compartilhados

`StatusBadge`, `KpiCard`, `PlanoProgresso`, `HorasInput` (máscara pt-BR), `EquipamentoAutocomplete`, `ConfirmDialog`, `EmptyState`, `ErrorState`, `PageHeader`, `DataTableToolbar`.

## Estados e comportamentos transversais

- **Loading:** skeleton, nunca tela em branco.
- **Vazio:** sempre com mensagem e ação sugerida.
- **Erro de rede:** `ErrorState` com retry.
- **Validação:** erros 400/422 do `ProblemDetail` mapeados para os campos; 409 para conflito (TAG duplicada, agendamento duplicado).
- **Após mutação:** invalidar as queries do painel, do detalhe e das listas relacionadas.

## Decisões adotadas

1. Precisão do horímetro: uma casa decimal (`DECIMAL(10,1)`).
2. Planos criados dentro do detalhe do equipamento.
3. Opcionais, só depois do núcleo pronto: card "Sem leitura há mais de 7 dias", gráfico de leituras, previsão de vencimento por média de uso.
