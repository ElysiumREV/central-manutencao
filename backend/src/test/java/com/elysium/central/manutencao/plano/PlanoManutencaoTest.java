package com.elysium.central.manutencao.plano;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.elysium.central.manutencao.equipamento.Equipamento;
import com.elysium.central.manutencao.equipamento.StatusEquipamento;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PlanoManutencaoTest {

    @Test
    void calculaStatusEmDiaQuandoAindaEstaForaDaAntecedencia() {
        PlanoManutencao plano = criarPlano("1400.0");

        assertEquals(StatusPlano.EM_DIA, plano.calcularStatus());
        assertEquals(new BigDecimal("100.0"), plano.calcularHorasRestantes());
    }

    @Test
    void consideraLimiteDaAntecedenciaComoProximo() {
        PlanoManutencao plano = criarPlano("1450.0");

        assertEquals(StatusPlano.PROXIMA, plano.calcularStatus());
        assertEquals(new BigDecimal("50.0"), plano.calcularHorasRestantes());
    }

    @Test
    void consideraLimiteDoVencimentoComoVencido() {
        PlanoManutencao plano = criarPlano("1500.0");

        assertEquals(StatusPlano.VENCIDA, plano.calcularStatus());
        assertEquals(new BigDecimal("0.0"), plano.calcularHorasRestantes());
    }

    @Test
    void permaneceVencidoDepoisDoLimite() {
        assertEquals(StatusPlano.VENCIDA, criarPlano("1550.0").calcularStatus());
    }

    @Test
    void atualizarConfiguracaoPreservaUltimaExecucaoERecalculaVencimento() {
        PlanoManutencao plano = criarPlano("1400.0");

        plano.atualizarConfiguracao("Plano revisado", new BigDecimal("300.0"),
                new BigDecimal("40.0"), true);

        assertEquals(new BigDecimal("1250.0"), plano.getHorimetroUltimaExecucao());
        assertEquals(new BigDecimal("1550.0"), plano.getProximoVencimento());
    }

    @Test
    void registrarExecucaoAtualizaUltimaExecucaoEProximoVencimento() {
        PlanoManutencao plano = criarPlano("1400.0");

        plano.registrarExecucao(new BigDecimal("1460.0"));

        assertEquals(new BigDecimal("1460.0"), plano.getHorimetroUltimaExecucao());
        assertEquals(new BigDecimal("1710.0"), plano.getProximoVencimento());
    }

    private static PlanoManutencao criarPlano(String horimetroAtual) {
        Equipamento equipamento = new Equipamento("EQ-TESTE", "Equipamento de teste", "Máquina",
                null, null, null, null, StatusEquipamento.ATIVO, new BigDecimal(horimetroAtual));
        return new PlanoManutencao(equipamento, "Manutenção preventiva", new BigDecimal("250.0"),
                new BigDecimal("50.0"), new BigDecimal("1250.0"), true);
    }
}
