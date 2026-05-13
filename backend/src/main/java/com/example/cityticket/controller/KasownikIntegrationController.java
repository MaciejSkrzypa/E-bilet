package com.example.cityticket.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.config.OpenApiConfig;
import com.example.cityticket.config.KasownikIntegrationPrincipal;
import com.example.cityticket.dto.KasownikIntegrationValidationRequest;
import com.example.cityticket.dto.TicketResponse;
import com.example.cityticket.service.TicketService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/integrations/kasownik")
@RequiredArgsConstructor
@Tag(name = "Kasownik Integrations")
public class KasownikIntegrationController {

	private final TicketService ticketService;

	@PostMapping("/validate")
	@Operation(
			summary = "Kasuje bilet przez klienta integracyjnego",
			description = "Endpoint dla zaufanego klienta technicznego. Uwierzytelnianie odbywa sie przez header X-Kasownik-Key, a pojazd jest pobierany z konfiguracji klienta.",
			security = @SecurityRequirement(name = OpenApiConfig.KASOWNIK_INTEGRATION_API_KEY_SCHEME))
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Bilet zostal poprawnie skasowany"),
			@ApiResponse(responseCode = "401", description = "Brak lub niepoprawny X-Kasownik-Key"),
			@ApiResponse(responseCode = "404", description = "Bilet nie istnieje"),
			@ApiResponse(responseCode = "409", description = "Bilet zostal juz wczesniej skasowany")
	})
	public TicketResponse validate(
			@Parameter(hidden = true) @AuthenticationPrincipal KasownikIntegrationPrincipal principal,
			@RequestBody @Valid KasownikIntegrationValidationRequest request) {
		return ticketService.validateForIntegrationClient(request.code(), principal.vehicleLabel());
	}
}
