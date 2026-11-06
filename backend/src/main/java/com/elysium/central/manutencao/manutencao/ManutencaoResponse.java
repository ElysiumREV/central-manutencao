package com.elysium.central.manutencao.manutencao;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ManutencaoResponse(
        Long id,
        Long equipamentoId,
        String codigoEquipamento,
        String nomeEquipamento,
        @Schema(nullable = true) Long planoId,
        @Schema(nullable = true) String nomePlano,
        TipoManutencao tipo,
        StatusManutencao status,
        @Schema(nullable = true) LocalDate dataAgendada,
        @Schema(nullable = true) Instant dataExecucao,
        @Schema(nullable = true) BigDecimal horimetroExecucao,
        @Schema(nullable = true) String responsavel,
        @Schema(nullable = true) String observacoes,
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
