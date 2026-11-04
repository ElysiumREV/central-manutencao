package com.elysium.central.manutencao.manutencao;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

final class ManutencaoSpecifications {

    private ManutencaoSpecifications() {}

    static Specification<Manutencao> buscar(Long equipamentoId, StatusManutencao status) {
        return (root, query, criteria) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (equipamentoId != null) filtros.add(criteria.equal(root.get("equipamento").get("id"), equipamentoId));
            if (status != null) filtros.add(criteria.equal(root.get("status"), status));
            return criteria.and(filtros.toArray(Predicate[]::new));
        };
    }
}
