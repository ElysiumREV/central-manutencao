package com.elysium.central.manutencao.equipamento;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "equipamento")
public class Equipamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false, length = 80)
    private String tipo;

    @Column(length = 100)
    private String fabricante;

    @Column(length = 100)
    private String modelo;

    @Column(name = "numero_serie", length = 100)
    private String numeroSerie;

    @Column(length = 150)
    private String localizacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusEquipamento status;

    @Column(name = "horimetro_atual", nullable = false, precision = 10, scale = 1)
    private BigDecimal horimetroAtual;

    @Column(name = "data_ultima_leitura")
    private Instant dataUltimaLeitura;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    protected Equipamento() {
    }

    public Equipamento(String codigo, String nome, String tipo, String fabricante,
            String modelo, String numeroSerie, String localizacao, StatusEquipamento status,
            BigDecimal horimetroAtual) {
        this.codigo = codigo;
        this.nome = nome;
        this.tipo = tipo;
        this.fabricante = fabricante;
        this.modelo = modelo;
        this.numeroSerie = numeroSerie;
        this.localizacao = localizacao;
        this.status = status;
        this.horimetroAtual = horimetroAtual;
    }

    public void atualizarDados(String codigo, String nome, String tipo, String fabricante,
            String modelo, String numeroSerie, String localizacao, StatusEquipamento status) {
        this.codigo = codigo;
        this.nome = nome;
        this.tipo = tipo;
        this.fabricante = fabricante;
        this.modelo = modelo;
        this.numeroSerie = numeroSerie;
        this.localizacao = localizacao;
        this.status = status;
    }

    public void inativar() {
        this.status = StatusEquipamento.INATIVO;
    }

    public void registrarLeitura(BigDecimal valor, Instant dataHora) {
        this.horimetroAtual = valor;
        this.dataUltimaLeitura = dataHora;
    }

    @PrePersist
    void aoCriar() {
        Instant agora = Instant.now();
        criadoEm = agora;
        atualizadoEm = agora;
        if (status == null) status = StatusEquipamento.ATIVO;
    }

    @PreUpdate
    void aoAtualizar() {
        atualizadoEm = Instant.now();
    }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getNome() { return nome; }
    public String getTipo() { return tipo; }
    public String getFabricante() { return fabricante; }
    public String getModelo() { return modelo; }
    public String getNumeroSerie() { return numeroSerie; }
    public String getLocalizacao() { return localizacao; }
    public StatusEquipamento getStatus() { return status; }
    public BigDecimal getHorimetroAtual() { return horimetroAtual; }
    public Instant getDataUltimaLeitura() { return dataUltimaLeitura; }
    public Long getVersion() { return version; }
    public Instant getCriadoEm() { return criadoEm; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
}
