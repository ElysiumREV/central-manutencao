package com.elysium.central.manutencao;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.elysium.central.manutencao.equipamento.Equipamento;
import com.elysium.central.manutencao.equipamento.EquipamentoRepository;
import com.elysium.central.manutencao.equipamento.StatusEquipamento;
import com.elysium.central.manutencao.manutencao.AgendarManutencaoRequest;
import com.elysium.central.manutencao.manutencao.ManutencaoService;
import com.elysium.central.manutencao.manutencao.TipoManutencao;
import com.elysium.central.manutencao.plano.CriarPlanoRequest;
import com.elysium.central.manutencao.plano.PlanoService;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Exercita a API pela camada HTTP para conferir o contrato de erros (ProblemDetail) e a autenticação.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = {
        "app.security.username=test-operator",
        "app.security.password=test-password"
})
@AutoConfigureMockMvc
@Transactional
class ErrosApiIntegrationTest {

    private static final String AUTH = "Basic " + Base64.getEncoder()
            .encodeToString("test-operator:test-password".getBytes(StandardCharsets.UTF_8));

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EquipamentoRepository equipamentoRepository;

    @Autowired
    private PlanoService planoService;

    @Autowired
    private ManutencaoService manutencaoService;

    @Test
    void validacaoRetorna400ComCamposInvalidos() throws Exception {
        mockMvc.perform(post("/api/v1/equipamentos")
                        .header(HttpHeaders.AUTHORIZATION, AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"codigo\":\"\",\"nome\":\"Gerador\",\"tipo\":\"Gerador\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.errors.codigo").exists())
                .andExpect(jsonPath("$.errors.horimetroInicial").exists());
    }

    @Test
    void codigoDuplicadoRetorna409() throws Exception {
        String corpo = "{\"codigo\":\"DUP-" + System.nanoTime() + "\",\"nome\":\"Gerador\","
                + "\"tipo\":\"Gerador\",\"horimetroInicial\":100.0}";
        mockMvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Já existe equipamento com este código."));
    }

    @Test
    void semCredenciaisRetorna401() throws Exception {
        mockMvc.perform(post("/api/v1/equipamentos").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listaManutencoesNaOrdemDePrazoEscolhida() throws Exception {
        Equipamento equipamento = equipamentoRepository.saveAndFlush(new Equipamento(
                "ORD-" + System.nanoTime(), "Equipamento de ordenação", "Máquina",
                null, null, null, null, StatusEquipamento.ATIVO, new BigDecimal("1000.0")));
        LocalDate hoje = LocalDate.now();
        // Cadastradas fora de ordem de propósito: o prazo de 10 dias é criado antes do de 3 dias.
        agendar(equipamento, "Plano distante", hoje.plusDays(10));
        agendar(equipamento, "Plano próximo", hoje.plusDays(3));

        mockMvc.perform(get("/api/v1/manutencoes").header(HttpHeaders.AUTHORIZATION, AUTH)
                        .param("equipamentoId", equipamento.getId().toString())
                        .param("sort", "dataAgendada,asc").param("sort", "id,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].dataAgendada").value(hoje.plusDays(3).toString()))
                .andExpect(jsonPath("$.content[1].dataAgendada").value(hoje.plusDays(10).toString()));

        mockMvc.perform(get("/api/v1/manutencoes").header(HttpHeaders.AUTHORIZATION, AUTH)
                        .param("equipamentoId", equipamento.getId().toString())
                        .param("sort", "dataAgendada,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].dataAgendada").value(hoje.plusDays(10).toString()));
    }

    @Test
    void campoDeOrdenacaoInexistenteRetorna400() throws Exception {
        mockMvc.perform(get("/api/v1/manutencoes").header(HttpHeaders.AUTHORIZATION, AUTH)
                        .param("sort", "campoQueNaoExiste,asc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Ordenação inválida"));
    }

    private void agendar(Equipamento equipamento, String nomePlano, LocalDate data) {
        var plano = planoService.criar(new CriarPlanoRequest(equipamento.getId(), nomePlano,
                new BigDecimal("250.0"), new BigDecimal("50.0"), new BigDecimal("900.0"), true));
        manutencaoService.agendar(new AgendarManutencaoRequest(equipamento.getId(), plano.id(),
                TipoManutencao.PREVENTIVA, data, "Oficina", null));
    }
}
