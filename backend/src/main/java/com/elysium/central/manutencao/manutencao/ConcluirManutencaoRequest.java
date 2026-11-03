package com.elysium.central.manutencao.manutencao;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public record ConcluirManutencaoRequest(
        @NotNull Instant dataExecucao,
        @NotNull @DecimalMin("0.0") @Digits(integer = 9, fraction = 1) BigDecimal horimetroExecucao,
        @Size(max = 2000) String observacoes
) {}
