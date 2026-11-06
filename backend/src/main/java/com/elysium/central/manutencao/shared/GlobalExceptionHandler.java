package com.elysium.central.manutencao.shared;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.core.PropertyReferenceException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Tratamento centralizado de erros no formato ProblemDetail (RFC 7807).
 *
 * <p>Estende {@link ResponseEntityExceptionHandler}, que já converte as exceções padrão do Spring MVC
 * (incluindo {@code ResponseStatusException} lançada pelos services). Aqui acrescentamos:
 * <ul>
 *   <li>erros de validação com a lista de campos inválidos (o padrão do Spring só diz "Invalid request content");</li>
 *   <li>conflito de lock otimista (edição concorrente) como 409 em vez de 500;</li>
 *   <li>violação de constraint do banco como 409, sem expor o SQL ao cliente.</li>
 * </ul>
 * Ao registrar este bean, o {@code ProblemDetailsExceptionHandler} automático do Boot deixa de ser criado.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> erros = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField,
                        erro -> erro.getDefaultMessage() == null ? "inválido" : erro.getDefaultMessage(),
                        (primeira, segunda) -> primeira,
                        LinkedHashMap::new));

        ProblemDetail problema = ex.getBody();
        problema.setTitle("Dados inválidos");
        problema.setDetail("Verifique os campos: " + erros.entrySet().stream()
                .map(erro -> erro.getKey() + " (" + erro.getValue() + ")")
                .collect(Collectors.joining("; ")) + ".");
        problema.setProperty("errors", erros);
        return handleExceptionInternal(ex, problema, headers, status, request);
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ProblemDetail handleOptimisticLock(OptimisticLockingFailureException ex) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "O registro foi alterado por outra operação. Recarregue os dados e tente novamente.");
        problema.setTitle("Conflito de edição");
        return problema;
    }

    @ExceptionHandler(PropertyReferenceException.class)
    public ProblemDetail handleSortInvalido(PropertyReferenceException ex) {
        // Lançada pelo Spring Data quando `?sort=` cita um campo que a entidade não tem; sem isso viraria 500.
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Campo de ordenação inválido: " + ex.getPropertyName() + ".");
        problema.setTitle("Ordenação inválida");
        return problema;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        // A causa (constraint violada) fica só no log; o cliente recebe uma mensagem genérica.
        log.warn("Violação de integridade: {}", ex.getMostSpecificCause().getMessage());
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "A operação viola uma regra de integridade dos dados. Verifique as informações e tente novamente.");
        problema.setTitle("Conflito de integridade");
        return problema;
    }
}
