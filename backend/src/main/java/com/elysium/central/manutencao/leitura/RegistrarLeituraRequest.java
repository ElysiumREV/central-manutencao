package com.elysium.central.manutencao.leitura;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public record RegistrarLeituraRequest(
        @NotNull @DecimalMin("0.0") @Digits(integer = 9, fraction = 1) BigDecimal valor,
        @NotNull Instant dataHora,
        @NotBlank @Size(max = 120) String responsavel,
        @Size(max = 500) String observacao
) {}
