package com.example.cityticket.dto;

import java.time.Instant;

public record LoginResponse(
		String token,
		Instant expiresAt,
		UserResponse user) {
}
