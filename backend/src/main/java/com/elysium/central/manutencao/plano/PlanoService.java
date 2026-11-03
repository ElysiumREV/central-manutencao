package com.elysium.central.manutencao.plano;

import com.elysium.central.manutencao.equipamento.Equipamento;
import com.elysium.central.manutencao.equipamento.EquipamentoRepository;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class PlanoService {

    private final PlanoRepository planoRepository;
    private final EquipamentoRepository equipamentoRepository;

    public PlanoService(PlanoRepository planoRepository, EquipamentoRepository equipamentoRepository) {
        this.planoRepository = planoRepository;
        this.equipamentoRepository = equipamentoRepository;
    }

    public PlanoResponse criar(CriarPlanoRequest request) {
        Equipamento equipamento = obterEquipamento(request.equipamentoId());
        validarValores(request.intervaloHoras(), request.antecedenciaAlertaHoras(),
                request.horimetroUltimaExecucao(), equipamento);
        PlanoManutencao plano = new PlanoManutencao(equipamento, request.nome().trim(),
                request.intervaloHoras(), request.antecedenciaAlertaHoras(),
                request.horimetroUltimaExecucao(), request.ativo());
        return PlanoResponse.de(planoRepository.saveAndFlush(plano));
    }

    @Transactional(readOnly = true)
    public Page<PlanoResponse> listar(Long equipamentoId, Boolean ativo, Pageable pageable) {
        return planoRepository.buscar(equipamentoId, ativo, pageable).map(PlanoResponse::de);
    }

    @Transactional(readOnly = true)
    public PlanoResponse buscarPorId(Long id) {
        return PlanoResponse.de(obterPlano(id));
    }

    public PlanoResponse atualizar(Long id, AtualizarPlanoRequest request) {
        PlanoManutencao plano = obterPlano(id);
        validarValores(request.intervaloHoras(), request.antecedenciaAlertaHoras(),
                request.horimetroUltimaExecucao(), plano.getEquipamento());
        plano.atualizarDados(request.nome().trim(), request.intervaloHoras(),
                request.antecedenciaAlertaHoras(), request.horimetroUltimaExecucao(), request.ativo());
        return PlanoResponse.de(planoRepository.saveAndFlush(plano));
    }

    public PlanoResponse alterarStatus(Long id, boolean ativo) {
        PlanoManutencao plano = obterPlano(id);
        plano.atualizarDados(plano.getNome(), plano.getIntervaloHoras(),
                plano.getAntecedenciaAlertaHoras(), plano.getHorimetroUltimaExecucao(), ativo);
        return PlanoResponse.de(planoRepository.saveAndFlush(plano));
    }

    private Equipamento obterEquipamento(Long id) {
        return equipamentoRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipamento não encontrado."));
    }

    private PlanoManutencao obterPlano(Long id) {
        return planoRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Plano não encontrado."));
    }

    private void validarValores(BigDecimal intervalo, BigDecimal antecedencia,
            BigDecimal ultimaExecucao, Equipamento equipamento) {
        if (antecedencia.compareTo(intervalo) >= 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "A antecedência do alerta deve ser menor que o intervalo do plano.");
        }
        if (ultimaExecucao.compareTo(equipamento.getHorimetroAtual()) > 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "O horímetro da última execução não pode superar o horímetro atual do equipamento.");
        }
    }
}
