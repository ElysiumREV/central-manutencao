package com.elysium.central.manutencao.equipamento;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EquipamentoRepository extends JpaRepository<Equipamento, Long> {

    boolean existsByCodigo(String codigo);

    boolean existsByCodigoAndIdNot(String codigo, Long id);

    @Query("""
            select e from Equipamento e
            where (:termo is null or lower(e.codigo) like lower(concat('%', :termo, '%'))
                or lower(e.nome) like lower(concat('%', :termo, '%')))
              and (:status is null or e.status = :status)
              and (:tipo is null or lower(e.tipo) = lower(:tipo))
            """)
    Page<Equipamento> buscar(@Param("termo") String termo,
            @Param("status") StatusEquipamento status,
            @Param("tipo") String tipo, Pageable pageable);
}
