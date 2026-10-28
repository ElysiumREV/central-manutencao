package com.elysium.central.manutencao;

import org.springframework.boot.SpringApplication;

public class TestCentralManutencaoApplication {

	public static void main(String[] args) {
		SpringApplication.from(CentralManutencaoApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
