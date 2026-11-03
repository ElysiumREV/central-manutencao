package com.elysium.central.manutencao.manutencao;

import jakarta.validation.constraints.Size;

public record CancelarManutencaoRequest(@Size(max = 500) String motivo) {}
