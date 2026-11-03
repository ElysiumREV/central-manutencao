package com.elysium.central.manutencao.equipamento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarEquipamentoRequest(
        @NotBlank @Size(max = 50) String codigo,
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Size(max = 80) String tipo,
        @Size(max = 100) String fabricante,
        @Size(max = 100) String modelo,
        @Size(max = 100) String numeroSerie,
        @Size(max = 150) String localizacao,
        @NotNull StatusEquipamento status
) {}
