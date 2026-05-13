package com.example.cityticket.config;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Component
@Validated
@ConfigurationProperties(prefix = "app.kasownik.integrations")
@Getter
@Setter
public class KasownikIntegrationProperties {

	@Valid
	private List<Client> clients = new ArrayList<>();

	public Optional<Client> findByApiKey(String apiKey) {
		return clients.stream()
				.filter(client -> client.getApiKey().equals(apiKey))
				.findFirst();
	}

	@Getter
	@Setter
	public static class Client {

		@NotBlank
		private String name;

		@NotBlank
		private String apiKey;

		@NotBlank
		private String vehicleLabel;
	}
}
