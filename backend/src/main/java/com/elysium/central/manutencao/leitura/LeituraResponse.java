package com.elysium.central.manutencao.leitura;

import java.math.BigDecimal;
import java.time.Instant;

public record LeituraResponse(
        Long id,
        Long equipamentoId,
        String codigoEquipamento,
        String nomeEquipamento,
        BigDecimal valor,
        Instant dataHora,
        String responsavel,
        String observacao,
        Instant criadoEm
) {
    static LeituraResponse de(LeituraHorimetro leitura) {
        return new LeituraResponse(leitura.getId(), leitura.getEquipamento().getId(),
                leitura.getEquipamento().getCodigo(), leitura.getEquipamento().getNome(),
                leitura.getValor(), leitura.getDataHora(), leitura.getResponsavel(),
                leitura.getObservacao(), leitura.getCriadoEm());
    }
}
