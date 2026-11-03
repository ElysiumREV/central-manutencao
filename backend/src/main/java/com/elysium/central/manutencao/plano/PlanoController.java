package com.elysium.central.manutencao.plano;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/planos")
public class PlanoController {

    private final PlanoService service;

    public PlanoController(PlanoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlanoResponse criar(@Valid @RequestBody CriarPlanoRequest request) {
        return service.criar(request);
    }

    @GetMapping
    public Page<PlanoResponse> listar(@RequestParam(required = false) Long equipamentoId,
            @RequestParam(required = false) Boolean ativo,
            @PageableDefault(size = 20, sort = "nome") Pageable pageable) {
        return service.listar(equipamentoId, ativo, pageable);
    }

    @GetMapping("/{id}")
    public PlanoResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public PlanoResponse atualizar(@PathVariable Long id,
            @Valid @RequestBody AtualizarPlanoRequest request) {
        return service.atualizar(id, request);
    }

    @PatchMapping("/{id}/status")
    public PlanoResponse alterarStatus(@PathVariable Long id, @RequestParam boolean ativo) {
        return service.alterarStatus(id, ativo);
    }
}
