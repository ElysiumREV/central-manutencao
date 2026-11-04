package com.elysium.central.manutencao.equipamento;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

final class EquipamentoSpecifications {

    private EquipamentoSpecifications() {}

    static Specification<Equipamento> buscar(String termo, StatusEquipamento status, String tipo) {
        return (root, query, criteria) -> {
            List<Predicate> filtros = new ArrayList<>();
            if (termo != null && !termo.isBlank()) {
                String padrao = "%" + termo.trim().toLowerCase() + "%";
                filtros.add(criteria.or(
                        criteria.like(criteria.lower(root.get("codigo")), padrao),
                        criteria.like(criteria.lower(root.get("nome")), padrao)));
            }
            if (status != null) filtros.add(criteria.equal(root.get("status"), status));
            if (tipo != null && !tipo.isBlank()) {
                filtros.add(criteria.equal(criteria.lower(root.get("tipo")), tipo.trim().toLowerCase()));
            }
            return criteria.and(filtros.toArray(Predicate[]::new));
        };
    }
}
