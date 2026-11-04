package com.elysium.central.manutencao.manutencao;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ManutencaoRepository extends JpaRepository<Manutencao, Long>, JpaSpecificationExecutor<Manutencao> {

    boolean existsByPlano_IdAndStatus(Long planoId, StatusManutencao status);

    long countByStatusAndDataAgendadaBetween(StatusManutencao status, LocalDate inicio, LocalDate fim);

    @EntityGraph(attributePaths = {"equipamento", "plano"})
    @Query("""
            select m from Manutencao m
            where m.status = com.elysium.central.manutencao.manutencao.StatusManutencao.AGENDADA
              and m.dataAgendada between :inicio and :fim
            order by m.dataAgendada asc, m.id asc
            """)
    List<Manutencao> buscarAgendadasEntre(@Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"equipamento", "plano"})
    Page<Manutencao> findAll(Specification<Manutencao> specification, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"equipamento", "plano"})
    Optional<Manutencao> findById(Long id);
}
