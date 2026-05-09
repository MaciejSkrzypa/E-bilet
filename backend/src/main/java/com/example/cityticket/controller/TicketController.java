package com.example.cityticket.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.dto.PurchaseRequest;
import com.example.cityticket.dto.TicketResponse;
import com.example.cityticket.service.TicketService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

	private final TicketService ticketService;

	@PostMapping
	public ResponseEntity<TicketResponse> purchase(
			Authentication auth,
			@RequestBody @Valid PurchaseRequest request) {
		TicketResponse response = ticketService.purchase(auth.getName(), request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@GetMapping
	public List<TicketResponse> myTickets(Authentication auth) {
		return ticketService.findMyTickets(auth.getName());
	}
}
