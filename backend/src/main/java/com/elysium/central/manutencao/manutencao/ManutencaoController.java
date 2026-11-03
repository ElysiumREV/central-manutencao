package com.elysium.central.manutencao.manutencao;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/manutencoes")
public class ManutencaoController {

    private final ManutencaoService service;

    public ManutencaoController(ManutencaoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ManutencaoResponse agendar(@Valid @RequestBody AgendarManutencaoRequest request) {
        return service.agendar(request);
    }

    @PostMapping("/concluidas")
    @ResponseStatus(HttpStatus.CREATED)
    public ManutencaoResponse registrarConcluida(@Valid @RequestBody RegistrarManutencaoRequest request) {
        return service.registrarConcluida(request);
    }

    @GetMapping
    public Page<ManutencaoResponse> listar(@RequestParam(required = false) Long equipamentoId,
            @RequestParam(required = false) StatusManutencao status,
            @PageableDefault(size = 20, sort = "dataAgendada") Pageable pageable) {
        return service.listar(equipamentoId, status, pageable);
    }

    @GetMapping("/{id}")
    public ManutencaoResponse buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PostMapping("/{id}/concluir")
    public ManutencaoResponse concluir(@PathVariable Long id,
            @Valid @RequestBody ConcluirManutencaoRequest request) {
        return service.concluir(id, request);
    }

    @PostMapping("/{id}/cancelar")
    public ManutencaoResponse cancelar(@PathVariable Long id,
            @Valid @RequestBody(required = false) CancelarManutencaoRequest request) {
        return service.cancelar(id, request);
    }
}
