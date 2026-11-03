package com.elysium.central.manutencao.plano;

import com.elysium.central.manutencao.equipamento.Equipamento;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "plano_manutencao")
public class PlanoManutencao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipamento_id", nullable = false)
    private Equipamento equipamento;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(name = "intervalo_horas", nullable = false, precision = 10, scale = 1)
    private BigDecimal intervaloHoras;

    @Column(name = "antecedencia_alerta_horas", nullable = false, precision = 10, scale = 1)
    private BigDecimal antecedenciaAlertaHoras;

    @Column(name = "horimetro_ultima_execucao", nullable = false, precision = 10, scale = 1)
    private BigDecimal horimetroUltimaExecucao;

    @Column(name = "proximo_vencimento", nullable = false, precision = 10, scale = 1)
    private BigDecimal proximoVencimento;

    @Column(nullable = false)
    private boolean ativo;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    protected PlanoManutencao() {
    }

    public PlanoManutencao(Equipamento equipamento, String nome, BigDecimal intervaloHoras,
            BigDecimal antecedenciaAlertaHoras, BigDecimal horimetroUltimaExecucao, boolean ativo) {
        this.equipamento = equipamento;
        atualizarDados(nome, intervaloHoras, antecedenciaAlertaHoras, horimetroUltimaExecucao, ativo);
    }

    public void atualizarDados(String nome, BigDecimal intervaloHoras,
            BigDecimal antecedenciaAlertaHoras, BigDecimal horimetroUltimaExecucao, boolean ativo) {
        this.nome = nome;
        this.intervaloHoras = intervaloHoras;
        this.antecedenciaAlertaHoras = antecedenciaAlertaHoras;
        this.horimetroUltimaExecucao = horimetroUltimaExecucao;
        this.proximoVencimento = horimetroUltimaExecucao.add(intervaloHoras);
        this.ativo = ativo;
    }

    public void registrarExecucao(BigDecimal horimetroExecucao) {
        this.horimetroUltimaExecucao = horimetroExecucao;
        this.proximoVencimento = horimetroExecucao.add(intervaloHoras);
    }

    public BigDecimal calcularHorasRestantes() {
        return proximoVencimento.subtract(equipamento.getHorimetroAtual());
    }

    public StatusPlano calcularStatus() {
        BigDecimal restantes = calcularHorasRestantes();
        if (restantes.signum() <= 0) return StatusPlano.VENCIDA;
        if (restantes.compareTo(antecedenciaAlertaHoras) <= 0) return StatusPlano.PROXIMA;
        return StatusPlano.EM_DIA;
    }

    @PrePersist
    void aoCriar() {
        Instant agora = Instant.now();
        criadoEm = agora;
        atualizadoEm = agora;
    }

    @PreUpdate
    void aoAtualizar() {
        atualizadoEm = Instant.now();
    }

    public Long getId() { return id; }
    public Equipamento getEquipamento() { return equipamento; }
    public String getNome() { return nome; }
    public BigDecimal getIntervaloHoras() { return intervaloHoras; }
    public BigDecimal getAntecedenciaAlertaHoras() { return antecedenciaAlertaHoras; }
    public BigDecimal getHorimetroUltimaExecucao() { return horimetroUltimaExecucao; }
    public BigDecimal getProximoVencimento() { return proximoVencimento; }
    public boolean isAtivo() { return ativo; }
    public Instant getCriadoEm() { return criadoEm; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
}
