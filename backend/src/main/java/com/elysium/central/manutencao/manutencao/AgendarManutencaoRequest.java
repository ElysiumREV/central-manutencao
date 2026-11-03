package com.elysium.central.manutencao.manutencao;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record AgendarManutencaoRequest(
        @NotNull Long equipamentoId,
        Long planoId,
        @NotNull TipoManutencao tipo,
        @NotNull LocalDate dataAgendada,
        @NotBlank @Size(max = 120) String responsavel,
        @Size(max = 2000) String observacoes
) {}
