package com.example.cityticket.dto;

import java.math.BigDecimal;

import com.example.cityticket.entity.Role;
import com.example.cityticket.entity.User;

public record UserResponse(
		Long id,
		String username,
		Role role,
		BigDecimal balance) {

	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getUsername(), user.getRole(), user.getBalance());
	}
}
