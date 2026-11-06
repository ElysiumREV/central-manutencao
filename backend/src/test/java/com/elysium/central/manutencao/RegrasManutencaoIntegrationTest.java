package com.elysium.central.manutencao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.elysium.central.manutencao.equipamento.Equipamento;
import com.elysium.central.manutencao.equipamento.EquipamentoRepository;
import com.elysium.central.manutencao.equipamento.StatusEquipamento;
import com.elysium.central.manutencao.leitura.LeituraService;
import com.elysium.central.manutencao.leitura.RegistrarLeituraRequest;
import com.elysium.central.manutencao.manutencao.AgendarManutencaoRequest;
import com.elysium.central.manutencao.manutencao.CancelarManutencaoRequest;
import com.elysium.central.manutencao.manutencao.ManutencaoService;
import com.elysium.central.manutencao.manutencao.RegistrarManutencaoRequest;
import com.elysium.central.manutencao.manutencao.StatusManutencao;
import com.elysium.central.manutencao.manutencao.TipoManutencao;
import com.elysium.central.manutencao.plano.AtualizarPlanoRequest;
import com.elysium.central.manutencao.plano.CriarPlanoRequest;
import com.elysium.central.manutencao.plano.PlanoRepository;
import com.elysium.central.manutencao.plano.PlanoService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = {
        "app.security.username=test-operator",
        "app.security.password=test-password"
})
@Transactional
class RegrasManutencaoIntegrationTest {

    @Autowired
    private EquipamentoRepository equipamentoRepository;

    @Autowired
    private PlanoRepository planoRepository;

    @Autowired
    private PlanoService planoService;

    @Autowired
    private ManutencaoService manutencaoService;

    @Autowired
    private LeituraService leituraService;

    @Test
    void atualizarConfiguracaoDoPlanoPreservaHorimetroDaUltimaExecucao() {
        Equipamento equipamento = criarEquipamento("1400.0");
        var plano = planoService.criar(criarPlano(equipamento, "1250.0"));

        var atualizado = planoService.atualizar(plano.id(),
                new AtualizarPlanoRequest("Troca de óleo revisada", new BigDecimal("300.0"),
                        new BigDecimal("50.0"), true));

        assertEquals(new BigDecimal("1250.0"), atualizado.horimetroUltimaExecucao());
        assertEquals(new BigDecimal("1550.0"), atualizado.proximoVencimento());
    }

    @Test
    void concluirManutencaoPreventivaAtualizaUltimaExecucaoEProximoVencimento() {
        Equipamento equipamento = criarEquipamento("1460.0");
        var plano = planoService.criar(criarPlano(equipamento, "1250.0"));

        var manutencao = manutencaoService.registrarConcluida(new RegistrarManutencaoRequest(
                equipamento.getId(), plano.id(), TipoManutencao.PREVENTIVA,
                Instant.now().minusSeconds(60), new BigDecimal("1460.0"), "Oficina", null));
        var planoAtualizado = planoRepository.findById(plano.id()).orElseThrow();

        assertEquals(StatusManutencao.CONCLUIDA, manutencao.status());
        assertEquals(new BigDecimal("1460.0"), planoAtualizado.getHorimetroUltimaExecucao());
        assertEquals(new BigDecimal("1710.0"), planoAtualizado.getProximoVencimento());
    }

    @Test
    void naoPermiteDuasManutencoesAgendadasParaOMesmoPlano() {
        Equipamento equipamento = criarEquipamento("1400.0");
        var plano = planoService.criar(criarPlano(equipamento, "1250.0"));
        var request = new AgendarManutencaoRequest(equipamento.getId(), plano.id(),
                TipoManutencao.PREVENTIVA, LocalDate.now().plusDays(1), "Oficina", null);
        manutencaoService.agendar(request);

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> manutencaoService.agendar(request));

        assertEquals(HttpStatus.CONFLICT, erro.getStatusCode());
    }

    @Test
    void rejeitaLeituraComDataAnteriorAUltimaLeitura() {
        Equipamento equipamento = criarEquipamento("1400.0");
        Instant ultimaLeitura = Instant.now().minusSeconds(7200);
        equipamento.registrarLeitura(new BigDecimal("1400.0"), ultimaLeitura);
        equipamentoRepository.saveAndFlush(equipamento);

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> leituraService.registrar(equipamento.getId(), new RegistrarLeituraRequest(
                        new BigDecimal("1410.0"), ultimaLeitura.minusSeconds(60), "Operador", null)));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, erro.getStatusCode());
    }

    @Test
    void rejeitaLeituraQueFazOHorimetroRegredir() {
        Equipamento equipamento = criarEquipamento("1400.0");

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> leituraService.registrar(equipamento.getId(), new RegistrarLeituraRequest(
                        new BigDecimal("1399.0"), Instant.now().minusSeconds(60), "Operador", null)));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, erro.getStatusCode());
        assertEquals(new BigDecimal("1400.0"), equipamentoRepository.findById(equipamento.getId())
                .orElseThrow().getHorimetroAtual());
    }

    @Test
    void rejeitaLeituraComDataNoFuturo() {
        Equipamento equipamento = criarEquipamento("1400.0");

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> leituraService.registrar(equipamento.getId(), new RegistrarLeituraRequest(
                        new BigDecimal("1410.0"), Instant.now().plusSeconds(3600), "Operador", null)));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, erro.getStatusCode());
    }

    @Test
    void aceitaLeituraIgualAoHorimetroAtual() {
        Equipamento equipamento = criarEquipamento("1400.0");

        var leitura = leituraService.registrar(equipamento.getId(), new RegistrarLeituraRequest(
                new BigDecimal("1400.0"), Instant.now().minusSeconds(60), "Operador", null));

        assertEquals(new BigDecimal("1400.0"), leitura.valor());
    }

    @Test
    void rejeitaLeituraParaEquipamentoInativo() {
        Equipamento equipamento = criarEquipamento("1400.0");
        equipamento.inativar();
        equipamentoRepository.saveAndFlush(equipamento);

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> leituraService.registrar(equipamento.getId(), new RegistrarLeituraRequest(
                        new BigDecimal("1410.0"), Instant.now().minusSeconds(60), "Operador", null)));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, erro.getStatusCode());
    }

    @Test
    void naoAgendaManutencaoParaPlanoInativo() {
        Equipamento equipamento = criarEquipamento("1400.0");
        var plano = planoService.criar(new CriarPlanoRequest(equipamento.getId(), "Troca de óleo",
                new BigDecimal("250.0"), new BigDecimal("50.0"), new BigDecimal("1250.0"), false));

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> manutencaoService.agendar(new AgendarManutencaoRequest(equipamento.getId(), plano.id(),
                        TipoManutencao.PREVENTIVA, LocalDate.now().plusDays(1), "Oficina", null)));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, erro.getStatusCode());
    }

    @Test
    void permiteNovoAgendamentoDepoisDeCancelarOAnterior() {
        Equipamento equipamento = criarEquipamento("1400.0");
        var plano = planoService.criar(criarPlano(equipamento, "1250.0"));
        var request = new AgendarManutencaoRequest(equipamento.getId(), plano.id(),
                TipoManutencao.PREVENTIVA, LocalDate.now().plusDays(1), "Oficina", null);
        var primeiro = manutencaoService.agendar(request);

        var cancelada = manutencaoService.cancelar(primeiro.id(), new CancelarManutencaoRequest("Reagendada"));
        var segundo = manutencaoService.agendar(request);

        assertEquals(StatusManutencao.CANCELADA, cancelada.status());
        assertEquals(StatusManutencao.AGENDADA, segundo.status());
    }

    @Test
    void rejeitaAgendamentoComDataNoPassado() {
        Equipamento equipamento = criarEquipamento("1400.0");
        var plano = planoService.criar(criarPlano(equipamento, "1250.0"));
        LocalDate ontem = LocalDate.now(ZoneId.of("America/Sao_Paulo")).minusDays(1);

        ResponseStatusException erro = assertThrows(ResponseStatusException.class,
                () -> manutencaoService.agendar(new AgendarManutencaoRequest(equipamento.getId(), plano.id(),
                        TipoManutencao.PREVENTIVA, ontem, "Oficina", null)));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, erro.getStatusCode());
    }

    @Test
    void aceitaAgendamentoParaHoje() {
        Equipamento equipamento = criarEquipamento("1400.0");
        var plano = planoService.criar(criarPlano(equipamento, "1250.0"));
        LocalDate hoje = LocalDate.now(ZoneId.of("America/Sao_Paulo"));

        var agendada = manutencaoService.agendar(new AgendarManutencaoRequest(equipamento.getId(), plano.id(),
                TipoManutencao.PREVENTIVA, hoje, "Oficina", null));

        assertEquals(StatusManutencao.AGENDADA, agendada.status());
    }

    private Equipamento criarEquipamento(String horimetro) {
        return equipamentoRepository.saveAndFlush(new Equipamento(
                "EQ-" + System.nanoTime(), "Equipamento de teste", "Máquina",
                null, null, null, null, StatusEquipamento.ATIVO, new BigDecimal(horimetro)));
    }

    private static CriarPlanoRequest criarPlano(Equipamento equipamento, String horimetroUltimaExecucao) {
        return new CriarPlanoRequest(equipamento.getId(), "Troca de óleo",
                new BigDecimal("250.0"), new BigDecimal("50.0"),
                new BigDecimal(horimetroUltimaExecucao), true);
    }
}
