package com.elysium.central.manutencao.leitura;

import jakarta.validation.Valid;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/v1")
public class LeituraController {

    private final LeituraService service;

    public LeituraController(LeituraService service) {
        this.service = service;
    }

    @PostMapping("/equipamentos/{equipamentoId}/leituras")
    @ResponseStatus(HttpStatus.CREATED)
    public LeituraResponse registrar(@PathVariable Long equipamentoId,
            @Valid @RequestBody RegistrarLeituraRequest request) {
        return service.registrar(equipamentoId, request);
    }

    @GetMapping({"/leituras", "/equipamentos/{equipamentoId}/leituras"})
    public Page<LeituraResponse> listar(@PathVariable(name = "equipamentoId", required = false) Long equipamentoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant ate,
            @PageableDefault(size = 20, sort = {"dataHora", "id"}, direction = Sort.Direction.DESC)
            Pageable pageable) {
        return service.listar(equipamentoId, de, ate, pageable);
    }
}
