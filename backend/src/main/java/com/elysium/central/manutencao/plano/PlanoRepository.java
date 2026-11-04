package com.elysium.central.manutencao.plano;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PlanoRepository extends JpaRepository<PlanoManutencao, Long>, JpaSpecificationExecutor<PlanoManutencao> {

    @Override
    @EntityGraph(attributePaths = "equipamento")
    Page<PlanoManutencao> findAll(Specification<PlanoManutencao> specification, Pageable pageable);
}
