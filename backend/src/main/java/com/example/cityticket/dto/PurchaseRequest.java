package com.example.cityticket.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record PurchaseRequest(
		@NotNull Long offerId,
		LocalDate validFrom,
		LocalDate validTo) {
}
