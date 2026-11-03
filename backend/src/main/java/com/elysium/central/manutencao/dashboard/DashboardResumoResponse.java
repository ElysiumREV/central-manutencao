package com.elysium.central.manutencao.dashboard;

import com.elysium.central.manutencao.alerta.AlertaResponse;
import com.elysium.central.manutencao.manutencao.ManutencaoResponse;
import java.util.List;

public record DashboardResumoResponse(
        long planosVencidos,
        long planosProximos,
        long planosEmDia,
        long manutencoesAgendadasProximosSeteDias,
        List<AlertaResponse> alertasCriticos,
        List<ManutencaoResponse> proximasManutencoes
) {}
