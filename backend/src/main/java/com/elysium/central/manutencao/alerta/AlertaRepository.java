package com.elysium.central.manutencao.alerta;

import com.elysium.central.manutencao.plano.PlanoManutencao;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AlertaRepository extends JpaRepository<PlanoManutencao, Long> {

    @EntityGraph(attributePaths = "equipamento")
    @Query("""
            select p from PlanoManutencao p join p.equipamento e
            where p.ativo = true
              and e.status <> com.elysium.central.manutencao.equipamento.StatusEquipamento.INATIVO
              and (
                    (:incluirVencidas = true and p.proximoVencimento <= e.horimetroAtual)
                 or (:incluirProximas = true and p.proximoVencimento > e.horimetroAtual
                     and p.proximoVencimento - e.horimetroAtual <= p.antecedenciaAlertaHoras)
              )
              and (:tipo is null or lower(e.tipo) = lower(:tipo))
              and (:termo is null or lower(e.codigo) like concat('%', lower(:termo), '%')
                   or lower(e.nome) like concat('%', lower(:termo), '%')
                   or lower(p.nome) like concat('%', lower(:termo), '%'))
            order by (p.proximoVencimento - e.horimetroAtual) asc
            """)
    Page<PlanoManutencao> buscarAlertas(@Param("incluirVencidas") boolean incluirVencidas,
            @Param("incluirProximas") boolean incluirProximas,
            @Param("tipo") String tipo, @Param("termo") String termo, Pageable pageable);

    @EntityGraph(attributePaths = "equipamento")
    @Query("""
            select p from PlanoManutencao p join p.equipamento e
            where p.ativo = true
              and e.status <> com.elysium.central.manutencao.equipamento.StatusEquipamento.INATIVO
            """)
    List<PlanoManutencao> listarPlanosAtivos();
}
