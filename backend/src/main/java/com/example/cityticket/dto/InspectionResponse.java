package com.example.cityticket.dto;

public record InspectionResponse(
		boolean valid,
		String reason,
		TicketResponse ticket) {
}
