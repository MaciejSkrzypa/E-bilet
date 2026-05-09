package com.example.cityticket.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.dto.InspectionRequest;
import com.example.cityticket.dto.InspectionResponse;
import com.example.cityticket.service.TicketService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/inspection")
@RequiredArgsConstructor
public class InspectionController {

	private final TicketService ticketService;

	@PostMapping("/check")
	public InspectionResponse check(@RequestBody @Valid InspectionRequest request) {
		return ticketService.inspect(request.code(), request.vehicleId());
	}
}
