package com.elysium.central.manutencao.manutencao;

import com.elysium.central.manutencao.equipamento.Equipamento;
import com.elysium.central.manutencao.equipamento.EquipamentoRepository;
import com.elysium.central.manutencao.equipamento.StatusEquipamento;
import com.elysium.central.manutencao.plano.PlanoManutencao;
import com.elysium.central.manutencao.plano.PlanoRepository;
import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ManutencaoService {

    private final ManutencaoRepository manutencaoRepository;
    private final EquipamentoRepository equipamentoRepository;
    private final PlanoRepository planoRepository;

    public ManutencaoService(ManutencaoRepository manutencaoRepository,
            EquipamentoRepository equipamentoRepository, PlanoRepository planoRepository) {
        this.manutencaoRepository = manutencaoRepository;
        this.equipamentoRepository = equipamentoRepository;
        this.planoRepository = planoRepository;
    }

    public ManutencaoResponse agendar(AgendarManutencaoRequest request) {
        Equipamento equipamento = obterEquipamento(request.equipamentoId());
        validarEquipamentoAtivo(equipamento);
        PlanoManutencao plano = obterPlanoOpcional(request.planoId(), equipamento);
        validarPlanoPreventivo(request.tipo(), plano, true);
        if (plano != null && manutencaoRepository.existsByPlano_IdAndStatus(
                plano.getId(), StatusManutencao.AGENDADA)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Já existe manutenção agendada para este plano.");
        }
        Manutencao manutencao = new Manutencao(equipamento, plano, request.tipo(),
                request.responsavel().trim(), limpar(request.observacoes()));
        manutencao.agendar(request.dataAgendada());
        return ManutencaoResponse.de(salvar(manutencao));
    }

    public ManutencaoResponse registrarConcluida(RegistrarManutencaoRequest request) {
        Equipamento equipamento = obterEquipamento(request.equipamentoId());
        validarEquipamentoAtivo(equipamento);
        PlanoManutencao plano = obterPlanoOpcional(request.planoId(), equipamento);
        validarPlanoPreventivo(request.tipo(), plano, false);
        validarExecucao(request.dataExecucao(), request.horimetroExecucao(), equipamento, plano);

        Manutencao manutencao = new Manutencao(equipamento, plano, request.tipo(),
                request.responsavel().trim(), limpar(request.observacoes()));
        manutencao.concluir(request.dataExecucao(), request.horimetroExecucao(), request.observacoes());
        atualizarPlanoSePreventiva(manutencao, request.horimetroExecucao());
        return ManutencaoResponse.de(manutencaoRepository.saveAndFlush(manutencao));
    }

    @Transactional(readOnly = true)
    public Page<ManutencaoResponse> listar(Long equipamentoId, StatusManutencao status, Pageable pageable) {
        return manutencaoRepository.findAll(ManutencaoSpecifications.buscar(equipamentoId, status), pageable)
                .map(ManutencaoResponse::de);
    }

    @Transactional(readOnly = true)
    public ManutencaoResponse buscarPorId(Long id) {
        return ManutencaoResponse.de(obterManutencao(id));
    }

    public ManutencaoResponse concluir(Long id, ConcluirManutencaoRequest request) {
        Manutencao manutencao = obterManutencao(id);
        if (manutencao.getStatus() != StatusManutencao.AGENDADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Somente uma manutenção agendada pode ser concluída.");
        }
        validarExecucao(request.dataExecucao(), request.horimetroExecucao(),
                manutencao.getEquipamento(), manutencao.getPlano());
        manutencao.concluir(request.dataExecucao(), request.horimetroExecucao(), request.observacoes());
        atualizarPlanoSePreventiva(manutencao, request.horimetroExecucao());
        return ManutencaoResponse.de(manutencaoRepository.saveAndFlush(manutencao));
    }

    public ManutencaoResponse cancelar(Long id, CancelarManutencaoRequest request) {
        Manutencao manutencao = obterManutencao(id);
        if (manutencao.getStatus() != StatusManutencao.AGENDADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Somente uma manutenção agendada pode ser cancelada.");
        }
        manutencao.cancelar(request == null ? null : request.motivo());
        return ManutencaoResponse.de(manutencaoRepository.saveAndFlush(manutencao));
    }

    private Equipamento obterEquipamento(Long id) {
        return equipamentoRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipamento não encontrado."));
    }

    private PlanoManutencao obterPlanoOpcional(Long planoId, Equipamento equipamento) {
        if (planoId == null) return null;
        PlanoManutencao plano = planoRepository.findById(planoId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Plano não encontrado."));
        if (!plano.getEquipamento().getId().equals(equipamento.getId())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "O plano informado pertence a outro equipamento.");
        }
        return plano;
    }

    private void validarEquipamentoAtivo(Equipamento equipamento) {
        if (equipamento.getStatus() == StatusEquipamento.INATIVO) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Não é possível criar manutenção para equipamento inativo.");
        }
    }

    private void validarPlanoPreventivo(TipoManutencao tipo, PlanoManutencao plano, boolean exigirAtivo) {
        if (tipo == TipoManutencao.PREVENTIVA && plano == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Manutenção preventiva precisa estar vinculada a um plano.");
        }
        if (exigirAtivo && plano != null && !plano.isAtivo()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Não é possível agendar manutenção para plano inativo.");
        }
    }

    private void validarExecucao(Instant dataExecucao, BigDecimal horimetroExecucao,
            Equipamento equipamento, PlanoManutencao plano) {
        if (dataExecucao.isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "A data de execução não pode estar no futuro.");
        }
        if (horimetroExecucao.compareTo(equipamento.getHorimetroAtual()) > 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "O horímetro da execução não pode superar o horímetro atual do equipamento.");
        }
        if (plano != null && horimetroExecucao.compareTo(plano.getHorimetroUltimaExecucao()) < 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "O horímetro da execução não pode ser menor que a execução anterior do plano.");
        }
    }

    private void atualizarPlanoSePreventiva(Manutencao manutencao, BigDecimal horimetroExecucao) {
        if (manutencao.getTipo() == TipoManutencao.PREVENTIVA) {
            manutencao.getPlano().registrarExecucao(horimetroExecucao);
        }
    }

    private Manutencao obterManutencao(Long id) {
        return manutencaoRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Manutenção não encontrada."));
    }

    private Manutencao salvar(Manutencao manutencao) {
        try {
            return manutencaoRepository.saveAndFlush(manutencao);
        } catch (DataIntegrityViolationException exception) {
            // As constraints do banco continuam protegendo contra conflitos concorrentes.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Conflito de integridade ao salvar a manutenção. Verifique os dados e tente novamente.", exception);
        }
    }

    private static String limpar(String valor) {
        if (valor == null || valor.isBlank()) return null;
        return valor.trim();
    }
}
