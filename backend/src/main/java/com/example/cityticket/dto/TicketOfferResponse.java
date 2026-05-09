package com.example.cityticket.dto;

import java.math.BigDecimal;

import com.example.cityticket.entity.Fare;
import com.example.cityticket.entity.TicketOffer;
import com.example.cityticket.entity.TicketType;

public record TicketOfferResponse(
		Long id,
		TicketType type,
		Fare fare,
		BigDecimal price,
		Integer durationMinutes) {

	public static TicketOfferResponse from(TicketOffer offer) {
		return new TicketOfferResponse(
				offer.getId(),
				offer.getType(),
				offer.getFare(),
				offer.getPrice(),
				offer.getDurationMinutes());
	}
}
