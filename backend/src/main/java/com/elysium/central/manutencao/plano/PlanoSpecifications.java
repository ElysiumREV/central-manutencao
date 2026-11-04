package com.elysium.central.manutencao.plano;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

final class PlanoSpecifications {

    private PlanoSpecifications() {}

    static Specification<PlanoManutencao> buscar(Long equipamentoId, Boolean ativo) {
        return (root, query, criteria) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (equipamentoId != null) filtros.add(criteria.equal(root.get("equipamento").get("id"), equipamentoId));
            if (ativo != null) filtros.add(criteria.equal(root.get("ativo"), ativo));
            return criteria.and(filtros.toArray(Predicate[]::new));
        };
    }
}
