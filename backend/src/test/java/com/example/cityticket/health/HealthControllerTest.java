package com.example.cityticket.health;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class HealthControllerTest {

	private final HealthController controller = new HealthController();

	@Test
	void shouldReturnUpStatus() {
		HealthResponse response = controller.health();

		assertEquals("UP", response.status());
		assertTrue(response.number() >= 1 && response.number() <= 1000);
	}
}
