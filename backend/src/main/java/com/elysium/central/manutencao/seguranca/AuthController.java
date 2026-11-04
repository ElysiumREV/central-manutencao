package com.elysium.central.manutencao.seguranca;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @GetMapping("/session")
    public SessaoResponse sessao(Authentication authentication) {
        return new SessaoResponse(authentication.getName());
    }

    public record SessaoResponse(String usuario) {}
}
