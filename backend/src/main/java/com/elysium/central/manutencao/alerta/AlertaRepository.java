package com.elysium.central.manutencao.alerta;

import com.elysium.central.manutencao.plano.PlanoManutencao;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.domain.Specification;

public interface AlertaRepository extends JpaRepository<PlanoManutencao, Long>,
        JpaSpecificationExecutor<PlanoManutencao> {

    @Override
    @EntityGraph(attributePaths = "equipamento")
    Page<PlanoManutencao> findAll(Specification<PlanoManutencao> specification, Pageable pageable);

    @EntityGraph(attributePaths = "equipamento")
    @Query("""
            select p from PlanoManutencao p join p.equipamento e
            where p.ativo = true
              and e.status <> com.elysium.central.manutencao.equipamento.StatusEquipamento.INATIVO
            """)
    List<PlanoManutencao> listarPlanosAtivos();
}
