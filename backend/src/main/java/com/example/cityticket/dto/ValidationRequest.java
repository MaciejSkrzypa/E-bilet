package com.example.cityticket.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record ValidationRequest(
		@NotNull UUID code,
		@NotNull Long vehicleId) {
}
