package com.elysium.central.manutencao.leitura;

import com.elysium.central.manutencao.equipamento.Equipamento;
import com.elysium.central.manutencao.equipamento.EquipamentoRepository;
import com.elysium.central.manutencao.equipamento.StatusEquipamento;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class LeituraService {

    private final LeituraRepository leituraRepository;
    private final EquipamentoRepository equipamentoRepository;

    public LeituraService(LeituraRepository leituraRepository, EquipamentoRepository equipamentoRepository) {
        this.leituraRepository = leituraRepository;
        this.equipamentoRepository = equipamentoRepository;
    }

    public LeituraResponse registrar(Long equipamentoId, RegistrarLeituraRequest request) {
        Equipamento equipamento = equipamentoRepository.findById(equipamentoId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipamento não encontrado."));

        if (equipamento.getStatus() == StatusEquipamento.INATIVO) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Não é possível registrar leitura para equipamento inativo.");
        }
        if (request.dataHora().isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "A data da leitura não pode estar no futuro.");
        }
        if (request.valor().compareTo(equipamento.getHorimetroAtual()) < 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "O valor da leitura não pode ser menor que o horímetro atual.");
        }

        equipamento.registrarLeitura(request.valor(), request.dataHora());
        try {
            equipamentoRepository.saveAndFlush(equipamento);
        } catch (ObjectOptimisticLockingFailureException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "O equipamento foi atualizado por outra leitura. Consulte o horímetro atual e tente novamente.",
                    exception);
        }

        LeituraHorimetro leitura = new LeituraHorimetro(equipamento, request.valor(), request.dataHora(),
                request.responsavel().trim(), limpar(request.observacao()));
        return LeituraResponse.de(leituraRepository.saveAndFlush(leitura));
    }

    @Transactional(readOnly = true)
    public Page<LeituraResponse> listar(Long equipamentoId, Instant de, Instant ate, Pageable pageable) {
        if (de != null && ate != null && de.isAfter(ate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O início do período deve ser anterior ou igual ao fim.");
        }
        return leituraRepository.findAll(LeituraSpecifications.buscar(equipamentoId, de, ate), pageable)
                .map(LeituraResponse::de);
    }

    private static String limpar(String valor) {
        if (valor == null || valor.isBlank()) return null;
        return valor.trim();
    }
}
