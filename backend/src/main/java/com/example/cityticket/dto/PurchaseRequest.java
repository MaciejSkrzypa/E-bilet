package com.example.cityticket.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

public record PurchaseRequest(
		@NotNull Long offerId,
		LocalDateTime validFrom,
		LocalDateTime validTo) {
}
