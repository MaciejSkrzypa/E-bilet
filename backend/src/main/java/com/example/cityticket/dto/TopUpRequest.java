package com.example.cityticket.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record TopUpRequest(
		@NotNull
		@DecimalMin(value = "0.01", message = "Amount must be positive")
		@DecimalMax(value = "10000.00", message = "Amount too large")
		BigDecimal amount) {
}
