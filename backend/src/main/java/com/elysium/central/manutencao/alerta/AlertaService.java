package com.elysium.central.manutencao.alerta;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AlertaService {

    private final AlertaRepository repository;

    public AlertaService(AlertaRepository repository) {
        this.repository = repository;
    }

    public Page<AlertaResponse> listar(NivelAlerta nivel, String tipo, String termo, Pageable pageable) {
        boolean incluirVencidas = nivel == null || nivel == NivelAlerta.VENCIDA;
        boolean incluirProximas = nivel == null || nivel == NivelAlerta.PROXIMA;
        String tipoLimpo = limpar(tipo);
        String termoLimpo = limpar(termo);
        return repository.buscarAlertas(incluirVencidas, incluirProximas, tipoLimpo, termoLimpo, pageable)
                .map(AlertaResponse::de);
    }

    private static String limpar(String valor) {
        if (valor == null || valor.isBlank()) return null;
        return valor.trim();
    }
}
