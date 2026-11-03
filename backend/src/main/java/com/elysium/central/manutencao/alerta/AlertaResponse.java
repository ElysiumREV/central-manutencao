package com.elysium.central.manutencao.alerta;

import com.elysium.central.manutencao.plano.PlanoManutencao;
import com.elysium.central.manutencao.plano.StatusPlano;
import java.math.BigDecimal;

public record AlertaResponse(
        Long planoId,
        String nomePlano,
        Long equipamentoId,
        String codigoEquipamento,
        String nomeEquipamento,
        String tipoEquipamento,
        BigDecimal horimetroAtual,
        BigDecimal proximoVencimento,
        BigDecimal horasRestantes,
        StatusPlano status
) {
    public static AlertaResponse de(PlanoManutencao plano) {
        return new AlertaResponse(plano.getId(), plano.getNome(),
                plano.getEquipamento().getId(), plano.getEquipamento().getCodigo(),
                plano.getEquipamento().getNome(), plano.getEquipamento().getTipo(),
                plano.getEquipamento().getHorimetroAtual(), plano.getProximoVencimento(),
                plano.calcularHorasRestantes(), plano.calcularStatus());
    }
}
