package com.example.cityticket.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.example.cityticket.entity.Fare;
import com.example.cityticket.entity.Ticket;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.entity.Vehicle;

public record TicketResponse(
		Long id,
		UUID code,
		TicketType type,
		Fare fare,
		BigDecimal price,
		LocalDateTime purchaseDate,
		Integer durationMinutes,
		LocalDate validFrom,
		LocalDate validTo,
		LocalDateTime validatedAt,
		Long validatedVehicleId,
		String validatedVehicleLabel) {

	public static TicketResponse from(Ticket ticket) {
		Vehicle vehicle = ticket.getValidatedVehicle();
		return new TicketResponse(
				ticket.getId(),
				ticket.getCode(),
				ticket.getType(),
				ticket.getFare(),
				ticket.getPrice(),
				ticket.getPurchaseDate(),
				ticket.getDurationMinutes(),
				ticket.getValidFrom(),
				ticket.getValidTo(),
				ticket.getValidatedAt(),
				vehicle != null ? vehicle.getId() : null,
				vehicle != null ? vehicle.getLabel() : null);
	}
}
