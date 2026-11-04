package com.elysium.central.manutencao.leitura;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface LeituraRepository extends JpaRepository<LeituraHorimetro, Long>, JpaSpecificationExecutor<LeituraHorimetro> {

    @Override
    @EntityGraph(attributePaths = "equipamento")
    Page<LeituraHorimetro> findAll(Specification<LeituraHorimetro> specification, Pageable pageable);
}
