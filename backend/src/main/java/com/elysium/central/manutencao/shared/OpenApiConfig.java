package com.elysium.central.manutencao.shared;

import io.swagger.v3.oas.models.media.Schema;
import java.util.ArrayList;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Ajusta o contrato OpenAPI usado para gerar os tipos do frontend ({@code npm run gen:api}).
 *
 * <p>Por padrão o springdoc declara todo campo de resposta como opcional, mas o Jackson sempre envia
 * todos os campos dos records (os vazios vão como {@code null}). Aqui os campos de resposta passam a ser
 * obrigatórios; os que podem ser nulos são anotados com {@code @Schema(nullable = true)} no próprio
 * record. Assim o TypeScript gerado distingue "sempre presente" de "pode ser null".
 * Os schemas de requisição ({@code *Request}) ficam como estão: lá o obrigatório vem do Bean Validation.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    OpenApiCustomizer camposDeRespostaObrigatorios() {
        return openApi -> {
            if (openApi.getComponents() == null || openApi.getComponents().getSchemas() == null) return;
            openApi.getComponents().getSchemas().forEach((nome, schema) -> {
                if (nome.endsWith("Request")) return;
                marcarTodosObrigatorios(schema);
            });
        };
    }

    private static void marcarTodosObrigatorios(Schema<?> schema) {
        if (schema.getProperties() == null || schema.getProperties().isEmpty()) return;
        schema.setRequired(new ArrayList<>(schema.getProperties().keySet()));
    }
}
