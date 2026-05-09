package com.example.cityticket.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.dto.PageResponse;
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
	public PageResponse<TicketOfferResponse> list(
			@PageableDefault(size = 20, sort = "id") Pageable pageable) {
		return PageResponse.from(ticketOfferService.listActive(pageable));
	}
}
