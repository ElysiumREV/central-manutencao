package com.elysium.central.manutencao.equipamento;

import java.math.BigDecimal;
import java.time.Instant;

public record EquipamentoResponse(
        Long id,
        String codigo,
        String nome,
        String tipo,
        String fabricante,
        String modelo,
        String numeroSerie,
        String localizacao,
        StatusEquipamento status,
        BigDecimal horimetroAtual,
        Instant dataUltimaLeitura,
        Long version,
        Instant criadoEm,
        Instant atualizadoEm
) {
    static EquipamentoResponse de(Equipamento equipamento) {
        return new EquipamentoResponse(equipamento.getId(), equipamento.getCodigo(),
                equipamento.getNome(), equipamento.getTipo(), equipamento.getFabricante(),
                equipamento.getModelo(), equipamento.getNumeroSerie(), equipamento.getLocalizacao(),
                equipamento.getStatus(), equipamento.getHorimetroAtual(),
                equipamento.getDataUltimaLeitura(), equipamento.getVersion(),
                equipamento.getCriadoEm(), equipamento.getAtualizadoEm());
    }
}
