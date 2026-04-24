package com.example.cityticket.health;

import java.util.concurrent.ThreadLocalRandom;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

	@GetMapping("/health")
	public HealthResponse health() {
		int randomNumber = ThreadLocalRandom.current().nextInt(1, 1001);

		return new HealthResponse("UP", randomNumber);
	}
}
