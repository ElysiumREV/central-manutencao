package com.elysium.central.manutencao.plano;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlanoRepository extends JpaRepository<PlanoManutencao, Long> {

    @Query("""
            select p from PlanoManutencao p
            where (:equipamentoId is null or p.equipamento.id = :equipamentoId)
              and (:ativo is null or p.ativo = :ativo)
            """)
    Page<PlanoManutencao> buscar(@Param("equipamentoId") Long equipamentoId,
            @Param("ativo") Boolean ativo, Pageable pageable);
}
