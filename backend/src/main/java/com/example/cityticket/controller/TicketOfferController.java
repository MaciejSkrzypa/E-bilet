package com.example.cityticket.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.dto.TicketOfferResponse;
import com.example.cityticket.service.TicketOfferService;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
@SecurityRequirements
public class TicketOfferController {

	private final TicketOfferService ticketOfferService;

	@GetMapping
	public List<TicketOfferResponse> list() {
		return ticketOfferService.listActive().stream()
				.map(TicketOfferResponse::from)
				.toList();
	}
}
