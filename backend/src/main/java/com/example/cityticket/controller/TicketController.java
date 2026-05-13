package com.example.cityticket.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.dto.PageResponse;
import com.example.cityticket.dto.PurchaseRequest;
import com.example.cityticket.dto.TicketFilterStatus;
import com.example.cityticket.dto.TicketResponse;
import com.example.cityticket.entity.TicketType;
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
	public PageResponse<TicketResponse> myTickets(
			Authentication auth,
			@RequestParam(required = false) List<TicketType> type,
			@RequestParam(required = false) List<TicketFilterStatus> status,
			@RequestParam Map<String, String> requestParams,
			@PageableDefault(size = 20, sort = "purchaseDate", direction = Sort.Direction.DESC) Pageable pageable) {
		rejectRemovedFilters(requestParams);
		return PageResponse.from(ticketService.findMyTickets(auth.getName(), type, status, pageable));
	}

	private void rejectRemovedFilters(Map<String, String> requestParams) {
		if (requestParams.containsKey("validated")) {
			throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Query parameter 'validated' has been removed. Use status=VALIDATED or status=REQUIRES_VALIDATION.");
		}
		if (requestParams.containsKey("active")) {
			throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Query parameter 'active' has been removed. Use status=ACTIVE.");
		}
	}
}
