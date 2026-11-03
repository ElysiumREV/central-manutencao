package com.elysium.central.manutencao.equipamento;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/equipamentos")
public class EquipamentoController {

    private final EquipamentoService service;

    public EquipamentoController(EquipamentoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EquipamentoResponse criar(@Valid @RequestBody CriarEquipamentoRequest request) {
        return service.criar(request);
    }

    @GetMapping
    public Page<EquipamentoResponse> listar(
            @RequestParam(required = false) String termo,
            @RequestParam(required = false) StatusEquipamento status,
            @RequestParam(required = false) String tipo,
            @PageableDefault(size = 20, sort = "nome") Pageable pageable) {
        return service.listar(termo, status, tipo, pageable);
    }

    @GetMapping("/{id}")
    public EquipamentoResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public EquipamentoResponse atualizar(@PathVariable Long id,
            @Valid @RequestBody AtualizarEquipamentoRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void inativar(@PathVariable Long id) {
        service.inativar(id);
    }
}
