package com.elysium.central.manutencao.leitura;

import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeituraRepository extends JpaRepository<LeituraHorimetro, Long> {

    @EntityGraph(attributePaths = "equipamento")
    @Query("""
            select l from LeituraHorimetro l
            where (:equipamentoId is null or l.equipamento.id = :equipamentoId)
              and (:de is null or l.dataHora >= :de)
              and (:ate is null or l.dataHora <= :ate)
            """)
    Page<LeituraHorimetro> buscar(@Param("equipamentoId") Long equipamentoId,
            @Param("de") Instant de, @Param("ate") Instant ate, Pageable pageable);
}
