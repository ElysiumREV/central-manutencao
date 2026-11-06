package com.elysium.central.manutencao;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Protege o contrato OpenAPI do qual o frontend gera seus tipos ({@code npm run gen:api}).
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = {
        "app.security.username=test-operator",
        "app.security.password=test-password"
})
@AutoConfigureMockMvc
class ContratoOpenApiIntegrationTest {

    private static final String SCHEMAS = "$.components.schemas.";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void camposDeRespostaSaoObrigatoriosENulosSaoExplicitos() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                // Resposta: todo campo é sempre enviado.
                .andExpect(jsonPath(SCHEMAS + "EquipamentoResponse.required",
                        hasItems("id", "codigo", "horimetroAtual", "dataUltimaLeitura")))
                .andExpect(jsonPath(SCHEMAS + "PageAlertaResponse.required", hasItems("content", "totalElements")))
                // Campo que pode vir vazio é declarado como nulo; campo obrigatório no banco, não.
                .andExpect(jsonPath(SCHEMAS + "EquipamentoResponse.properties.dataUltimaLeitura.type", hasItem("null")))
                .andExpect(jsonPath(SCHEMAS + "ManutencaoResponse.properties.planoId.type", hasItem("null")))
                .andExpect(jsonPath(SCHEMAS + "EquipamentoResponse.properties.codigo.type", not(hasItem("null"))))
                // Requisição: o obrigatório continua vindo do Bean Validation.
                .andExpect(jsonPath(SCHEMAS + "AgendarManutencaoRequest.required", not(hasItem("planoId"))));
    }
}
