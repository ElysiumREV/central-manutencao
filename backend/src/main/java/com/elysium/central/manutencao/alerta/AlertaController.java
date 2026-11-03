package com.elysium.central.manutencao.alerta;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/alertas")
public class AlertaController {

    private final AlertaService service;

    public AlertaController(AlertaService service) {
        this.service = service;
    }

    @GetMapping
    public Page<AlertaResponse> listar(@RequestParam(required = false) NivelAlerta nivel,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String termo,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.listar(nivel, tipo, termo, pageable);
    }
}
