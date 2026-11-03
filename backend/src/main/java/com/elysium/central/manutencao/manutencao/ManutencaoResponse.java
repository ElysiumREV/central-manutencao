package com.elysium.central.manutencao.manutencao;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ManutencaoResponse(
        Long id,
        Long equipamentoId,
        String codigoEquipamento,
        String nomeEquipamento,
        Long planoId,
        String nomePlano,
        TipoManutencao tipo,
        StatusManutencao status,
        LocalDate dataAgendada,
        Instant dataExecucao,
        BigDecimal horimetroExecucao,
        String responsavel,
        String observacoes,
        Instant criadoEm,
        Instant atualizadoEm
) {
    public static ManutencaoResponse de(Manutencao manutencao) {
        return new ManutencaoResponse(manutencao.getId(), manutencao.getEquipamento().getId(),
                manutencao.getEquipamento().getCodigo(), manutencao.getEquipamento().getNome(),
                manutencao.getPlano() == null ? null : manutencao.getPlano().getId(),
                manutencao.getPlano() == null ? null : manutencao.getPlano().getNome(),
                manutencao.getTipo(), manutencao.getStatus(), manutencao.getDataAgendada(),
                manutencao.getDataExecucao(), manutencao.getHorimetroExecucao(),
                manutencao.getResponsavel(), manutencao.getObservacoes(),
                manutencao.getCriadoEm(), manutencao.getAtualizadoEm());
    }
}
