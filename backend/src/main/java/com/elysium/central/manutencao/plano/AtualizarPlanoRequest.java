package com.elysium.central.manutencao.plano;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record AtualizarPlanoRequest(
        @NotBlank @Size(max = 120) String nome,
        @NotNull @DecimalMin("0.1") @Digits(integer = 9, fraction = 1) BigDecimal intervaloHoras,
        @NotNull @DecimalMin("0.0") @Digits(integer = 9, fraction = 1) BigDecimal antecedenciaAlertaHoras,
        @NotNull @DecimalMin("0.0") @Digits(integer = 9, fraction = 1) BigDecimal horimetroUltimaExecucao,
        @NotNull Boolean ativo
) {}
