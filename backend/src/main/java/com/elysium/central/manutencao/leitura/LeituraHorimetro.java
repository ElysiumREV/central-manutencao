package com.elysium.central.manutencao.leitura;

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
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "leitura_horimetro")
public class LeituraHorimetro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipamento_id", nullable = false)
    private Equipamento equipamento;

    @Column(nullable = false, precision = 10, scale = 1)
    private BigDecimal valor;

    @Column(name = "data_hora", nullable = false)
    private Instant dataHora;

    @Column(nullable = false, length = 120)
    private String responsavel;

    @Column(length = 500)
    private String observacao;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected LeituraHorimetro() {
    }

    public LeituraHorimetro(Equipamento equipamento, BigDecimal valor, Instant dataHora,
            String responsavel, String observacao) {
        this.equipamento = equipamento;
        this.valor = valor;
        this.dataHora = dataHora;
        this.responsavel = responsavel;
        this.observacao = observacao;
    }

    @PrePersist
    void aoCriar() {
        criadoEm = Instant.now();
    }

    public Long getId() { return id; }
    public Equipamento getEquipamento() { return equipamento; }
    public BigDecimal getValor() { return valor; }
    public Instant getDataHora() { return dataHora; }
    public String getResponsavel() { return responsavel; }
    public String getObservacao() { return observacao; }
    public Instant getCriadoEm() { return criadoEm; }
}
