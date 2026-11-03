package com.elysium.central.manutencao.equipamento;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class EquipamentoService {

    private final EquipamentoRepository repository;

    public EquipamentoService(EquipamentoRepository repository) {
        this.repository = repository;
    }

    public EquipamentoResponse criar(CriarEquipamentoRequest request) {
        String codigo = request.codigo().trim();
        if (repository.existsByCodigo(codigo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe equipamento com este código.");
        }
        Equipamento equipamento = new Equipamento(codigo, request.nome().trim(), request.tipo().trim(),
                limpar(request.fabricante()), limpar(request.modelo()), limpar(request.numeroSerie()),
                limpar(request.localizacao()), StatusEquipamento.ATIVO, request.horimetroInicial());
        return EquipamentoResponse.de(salvar(equipamento));
    }

    @Transactional(readOnly = true)
    public Page<EquipamentoResponse> listar(String termo, StatusEquipamento status, String tipo, Pageable pageable) {
        String termoLimpo = limpar(termo);
        String tipoLimpo = limpar(tipo);
        return repository.buscar(termoLimpo, status, tipoLimpo, pageable).map(EquipamentoResponse::de);
    }

    @Transactional(readOnly = true)
    public EquipamentoResponse buscarPorId(Long id) {
        return EquipamentoResponse.de(obter(id));
    }

    public EquipamentoResponse atualizar(Long id, AtualizarEquipamentoRequest request) {
        Equipamento equipamento = obter(id);
        String codigo = request.codigo().trim();
        if (repository.existsByCodigoAndIdNot(codigo, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe equipamento com este código.");
        }
        equipamento.atualizarDados(codigo, request.nome().trim(), request.tipo().trim(),
                limpar(request.fabricante()), limpar(request.modelo()), limpar(request.numeroSerie()),
                limpar(request.localizacao()), request.status());
        return EquipamentoResponse.de(salvar(equipamento));
    }

    public void inativar(Long id) {
        Equipamento equipamento = obter(id);
        equipamento.inativar();
        repository.saveAndFlush(equipamento);
    }

    private Equipamento obter(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipamento não encontrado."));
    }

    private Equipamento salvar(Equipamento equipamento) {
        try {
            return repository.saveAndFlush(equipamento);
        } catch (DataIntegrityViolationException exception) {
            // O índice UNIQUE no banco também protege contra duas criações concorrentes.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Conflito ao salvar equipamento. Verifique se o código já está cadastrado.", exception);
        }
    }

    private static String limpar(String valor) {
        if (valor == null || valor.isBlank()) return null;
        return valor.trim();
    }
}
