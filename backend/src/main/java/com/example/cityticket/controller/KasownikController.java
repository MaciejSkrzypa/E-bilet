package com.example.cityticket.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.dto.TicketResponse;
import com.example.cityticket.dto.ValidationRequest;
import com.example.cityticket.service.TicketService;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/kasownik")
@RequiredArgsConstructor
@SecurityRequirements
public class KasownikController {

	private final TicketService ticketService;

	@PostMapping("/validate")
	public TicketResponse validate(@RequestBody @Valid ValidationRequest request) {
		return ticketService.validate(request.code(), request.vehicleId());
	}
}
