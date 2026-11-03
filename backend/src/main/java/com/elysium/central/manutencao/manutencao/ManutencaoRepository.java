package com.elysium.central.manutencao.manutencao;

import java.util.Optional;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ManutencaoRepository extends JpaRepository<Manutencao, Long> {

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

    @EntityGraph(attributePaths = {"equipamento", "plano"})
    @Query("""
            select m from Manutencao m
            where (:equipamentoId is null or m.equipamento.id = :equipamentoId)
              and (:status is null or m.status = :status)
            """)
    Page<Manutencao> buscar(@Param("equipamentoId") Long equipamentoId,
            @Param("status") StatusManutencao status, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"equipamento", "plano"})
    Optional<Manutencao> findById(Long id);
}
