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

	private static final String SECURITY_SCHEME = "bearerAuth";

	@Bean
	public OpenAPI cityTicketOpenAPI() {
		return new OpenAPI()
				.info(new Info()
						.title("E-bilet API")
						.description("Backend systemu elektronicznych biletów miejskich.")
						.version("0.0.1"))
				.addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME))
				.components(new Components()
						.addSecuritySchemes(SECURITY_SCHEME, new SecurityScheme()
								.type(SecurityScheme.Type.HTTP)
								.scheme("bearer")
								.bearerFormat("JWT")));
	}
}
