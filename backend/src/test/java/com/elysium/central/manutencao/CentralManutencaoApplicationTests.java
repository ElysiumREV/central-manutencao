package com.elysium.central.manutencao;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = {
		"app.security.username=test-operator",
		"app.security.password=test-password"
})
class CentralManutencaoApplicationTests {

	@Test
	void contextLoads() {
	}

}
