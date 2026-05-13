package com.example.cityticket.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

@Configuration
public class OpenApiConfig {

	public static final String BEARER_AUTH_SCHEME = "bearerAuth";
	public static final String KASOWNIK_INTEGRATION_API_KEY_SCHEME = "kasownikApiKey";
	private static final String KASOWNIK_INTEGRATION_API_KEY_HEADER = "X-Kasownik-Key";

	@Bean
	public OpenAPI cityTicketOpenAPI() {
		return new OpenAPI()
				.info(new Info()
						.title("E-bilet API")
						.description("Backend systemu elektronicznych biletów miejskich.")
						.version("0.0.1"))
				.addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH_SCHEME))
				.components(new Components()
						.addSecuritySchemes(BEARER_AUTH_SCHEME, new SecurityScheme()
								.type(SecurityScheme.Type.HTTP)
								.scheme("bearer")
								.bearerFormat("JWT"))
						.addSecuritySchemes(KASOWNIK_INTEGRATION_API_KEY_SCHEME, new SecurityScheme()
								.type(SecurityScheme.Type.APIKEY)
								.in(SecurityScheme.In.HEADER)
								.name(KASOWNIK_INTEGRATION_API_KEY_HEADER)));
	}
}
