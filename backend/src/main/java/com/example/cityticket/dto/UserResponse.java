package com.example.cityticket.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.example.cityticket.entity.Role;
import com.example.cityticket.entity.User;

public record UserResponse(
		Long id,
		String email,
		String firstName,
		String lastName,
		LocalDate dateOfBirth,
		Role role,
		BigDecimal balance) {

	public static UserResponse from(User user) {
		return new UserResponse(
				user.getId(),
				user.getEmail(),
				user.getFirstName(),
				user.getLastName(),
				user.getDateOfBirth(),
				user.getRole(),
				user.getBalance());
	}
}
