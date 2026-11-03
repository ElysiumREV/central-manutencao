package com.elysium.central.manutencao.manutencao;

import com.elysium.central.manutencao.equipamento.Equipamento;
import com.elysium.central.manutencao.plano.PlanoManutencao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import java.time.LocalDate;

@Entity
@Table(name = "manutencao")
public class Manutencao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipamento_id", nullable = false)
    private Equipamento equipamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plano_id")
    private PlanoManutencao plano;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoManutencao tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusManutencao status;

    @Column(name = "data_agendada")
    private LocalDate dataAgendada;

    @Column(name = "data_execucao")
    private Instant dataExecucao;

    @Column(name = "horimetro_execucao", precision = 10, scale = 1)
    private BigDecimal horimetroExecucao;

    @Column(length = 120)
    private String responsavel;

    @Column(columnDefinition = "text")
    private String observacoes;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    protected Manutencao() {
    }

    public Manutencao(Equipamento equipamento, PlanoManutencao plano,
            TipoManutencao tipo, String responsavel, String observacoes) {
        this.equipamento = equipamento;
        this.plano = plano;
        this.tipo = tipo;
        this.responsavel = responsavel;
        this.observacoes = observacoes;
    }

    public void agendar(LocalDate dataAgendada) {
        this.dataAgendada = dataAgendada;
        this.status = StatusManutencao.AGENDADA;
    }

    public void concluir(Instant dataExecucao, BigDecimal horimetroExecucao, String observacoes) {
        this.dataExecucao = dataExecucao;
        this.horimetroExecucao = horimetroExecucao;
        if (observacoes != null && !observacoes.isBlank()) this.observacoes = observacoes.trim();
        this.status = StatusManutencao.CONCLUIDA;
    }

    public void cancelar(String motivo) {
        this.status = StatusManutencao.CANCELADA;
        if (motivo != null && !motivo.isBlank()) {
            String motivoLimpo = motivo.trim();
            this.observacoes = this.observacoes == null || this.observacoes.isBlank()
                    ? "Cancelamento: " + motivoLimpo
                    : this.observacoes + "\nCancelamento: " + motivoLimpo;
        }
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
    public PlanoManutencao getPlano() { return plano; }
    public TipoManutencao getTipo() { return tipo; }
    public StatusManutencao getStatus() { return status; }
    public LocalDate getDataAgendada() { return dataAgendada; }
    public Instant getDataExecucao() { return dataExecucao; }
    public BigDecimal getHorimetroExecucao() { return horimetroExecucao; }
    public String getResponsavel() { return responsavel; }
    public String getObservacoes() { return observacoes; }
    public Instant getCriadoEm() { return criadoEm; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
}
