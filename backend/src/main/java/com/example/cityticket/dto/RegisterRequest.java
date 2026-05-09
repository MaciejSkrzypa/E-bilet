package com.example.cityticket.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
		@NotBlank @Email @Size(max = 254) String email,
		@NotBlank @Size(min = 6, max = 128) String password,
		@NotBlank @Size(max = 64) String firstName,
		@NotBlank @Size(max = 64) String lastName,
		@NotNull @Past LocalDate dateOfBirth) {
}
