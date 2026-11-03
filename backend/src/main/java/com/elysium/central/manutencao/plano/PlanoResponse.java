package com.elysium.central.manutencao.plano;

import java.math.BigDecimal;
import java.time.Instant;

public record PlanoResponse(
        Long id,
        Long equipamentoId,
        String codigoEquipamento,
        String nomeEquipamento,
        String nome,
        BigDecimal intervaloHoras,
        BigDecimal antecedenciaAlertaHoras,
        BigDecimal horimetroUltimaExecucao,
        BigDecimal proximoVencimento,
        BigDecimal horimetroAtual,
        BigDecimal horasRestantes,
        StatusPlano status,
        boolean ativo,
        Instant criadoEm,
        Instant atualizadoEm
) {
    static PlanoResponse de(PlanoManutencao plano) {
        BigDecimal atual = plano.getEquipamento().getHorimetroAtual();
        BigDecimal restante = plano.calcularHorasRestantes();
        StatusPlano status = plano.calcularStatus();
        return new PlanoResponse(plano.getId(), plano.getEquipamento().getId(),
                plano.getEquipamento().getCodigo(), plano.getEquipamento().getNome(),
                plano.getNome(), plano.getIntervaloHoras(), plano.getAntecedenciaAlertaHoras(),
                plano.getHorimetroUltimaExecucao(), plano.getProximoVencimento(), atual,
                restante, status, plano.isAtivo(), plano.getCriadoEm(), plano.getAtualizadoEm());
    }
}
