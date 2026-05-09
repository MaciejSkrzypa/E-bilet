package com.example.cityticket.controller;

import java.util.concurrent.ThreadLocalRandom;

import com.example.cityticket.dto.HealthResponse;
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
