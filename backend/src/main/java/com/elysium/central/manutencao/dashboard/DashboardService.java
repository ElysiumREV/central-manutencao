package com.elysium.central.manutencao.dashboard;

import com.elysium.central.manutencao.alerta.AlertaRepository;
import com.elysium.central.manutencao.alerta.AlertaResponse;
import com.elysium.central.manutencao.alerta.AlertaSpecifications;
import com.elysium.central.manutencao.alerta.NivelAlerta;
import com.elysium.central.manutencao.manutencao.ManutencaoRepository;
import com.elysium.central.manutencao.manutencao.ManutencaoResponse;
import com.elysium.central.manutencao.manutencao.StatusManutencao;
import com.elysium.central.manutencao.plano.PlanoManutencao;
import com.elysium.central.manutencao.plano.StatusPlano;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final AlertaRepository alertaRepository;
    private final ManutencaoRepository manutencaoRepository;
    /** Mesmo fuso usado pelas regras de agendamento (`app.zona-horaria`). */
    private final ZoneId fusoNegocio;

    public DashboardService(AlertaRepository alertaRepository, ManutencaoRepository manutencaoRepository,
            @Value("${app.zona-horaria:America/Sao_Paulo}") String fusoNegocio) {
        this.alertaRepository = alertaRepository;
        this.manutencaoRepository = manutencaoRepository;
        this.fusoNegocio = ZoneId.of(fusoNegocio);
    }

    public DashboardResumoResponse resumo() {
        long vencidas = 0;
        long proximas = 0;
        long emDia = 0;
        for (PlanoManutencao plano : alertaRepository.listarPlanosAtivos()) {
            StatusPlano status = plano.calcularStatus();
            if (status == StatusPlano.VENCIDA) vencidas++;
            else if (status == StatusPlano.PROXIMA) proximas++;
            else emDia++;
        }

        LocalDate hoje = LocalDate.now(fusoNegocio);
        LocalDate limite = hoje.plusDays(7);
        long agendadas = manutencaoRepository.countByStatusAndDataAgendadaBetween(
                StatusManutencao.AGENDADA, hoje, limite);

        List<AlertaResponse> criticos = alertaRepository
                .findAll(AlertaSpecifications.para(NivelAlerta.VENCIDA, null, null), PageRequest.of(0, 5))
                .map(AlertaResponse::de).getContent();
        List<ManutencaoResponse> proximasManutencoes = manutencaoRepository
                .buscarAgendadasEntre(hoje, limite, PageRequest.of(0, 5))
                .stream().map(ManutencaoResponse::de).toList();

        return new DashboardResumoResponse(vencidas, proximas, emDia, agendadas,
                criticos, proximasManutencoes);
    }
}
