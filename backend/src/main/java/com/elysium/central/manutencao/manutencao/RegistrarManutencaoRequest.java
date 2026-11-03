package com.elysium.central.manutencao.manutencao;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public record RegistrarManutencaoRequest(
        @NotNull Long equipamentoId,
        Long planoId,
        @NotNull TipoManutencao tipo,
        @NotNull Instant dataExecucao,
        @NotNull @DecimalMin("0.0") @Digits(integer = 9, fraction = 1) BigDecimal horimetroExecucao,
        @NotBlank @Size(max = 120) String responsavel,
        @Size(max = 2000) String observacoes
) {}
