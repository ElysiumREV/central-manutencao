package com.elysium.central.manutencao.alerta;

import com.elysium.central.manutencao.equipamento.StatusEquipamento;
import com.elysium.central.manutencao.plano.PlanoManutencao;
import java.math.BigDecimal;
import java.util.ArrayList;
import org.springframework.data.jpa.domain.Specification;

public final class AlertaSpecifications {

    private AlertaSpecifications() {
    }

    public static Specification<PlanoManutencao> para(NivelAlerta nivel, String tipo, String termo) {
        return (root, query, criteria) -> {
            var equipamento = root.join("equipamento");
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();

            predicates.add(criteria.isTrue(root.get("ativo")));
            predicates.add(criteria.notEqual(equipamento.get("status"), StatusEquipamento.INATIVO));

            var vencimento = root.<BigDecimal>get("proximoVencimento");
            var horimetroAtual = equipamento.<BigDecimal>get("horimetroAtual");
            var restante = criteria.diff(vencimento, horimetroAtual);
            var vencida = criteria.lessThanOrEqualTo(vencimento, horimetroAtual);
            var proxima = criteria.and(
                    criteria.greaterThan(vencimento, horimetroAtual),
                    criteria.lessThanOrEqualTo(restante, root.<BigDecimal>get("antecedenciaAlertaHoras")));

            if (nivel == NivelAlerta.VENCIDA) {
                predicates.add(vencida);
            } else if (nivel == NivelAlerta.PROXIMA) {
                predicates.add(proxima);
            } else {
                predicates.add(criteria.or(vencida, proxima));
            }

            if (tipo != null) {
                predicates.add(criteria.equal(criteria.lower(equipamento.<String>get("tipo")),
                        tipo.toLowerCase(java.util.Locale.ROOT)));
            }

            if (termo != null) {
                String termoBusca = "%" + termo.toLowerCase(java.util.Locale.ROOT) + "%";
                var codigo = criteria.like(criteria.lower(equipamento.<String>get("codigo")), termoBusca);
                var nomeEquipamento = criteria.like(criteria.lower(equipamento.<String>get("nome")), termoBusca);
                var nomePlano = criteria.like(criteria.lower(root.<String>get("nome")), termoBusca);
                predicates.add(criteria.or(codigo, nomeEquipamento, nomePlano));
            }

            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                query.orderBy(criteria.asc(restante), criteria.asc(root.get("id")));
            }

            return criteria.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }
}
