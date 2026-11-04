package com.elysium.central.manutencao.leitura;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

final class LeituraSpecifications {

    private LeituraSpecifications() {}

    static Specification<LeituraHorimetro> buscar(Long equipamentoId, Instant de, Instant ate) {
        return (root, query, criteria) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (equipamentoId != null) filtros.add(criteria.equal(root.get("equipamento").get("id"), equipamentoId));
            if (de != null) filtros.add(criteria.greaterThanOrEqualTo(root.get("dataHora"), de));
            if (ate != null) filtros.add(criteria.lessThanOrEqualTo(root.get("dataHora"), ate));
            return criteria.and(filtros.toArray(Predicate[]::new));
        };
    }
}
