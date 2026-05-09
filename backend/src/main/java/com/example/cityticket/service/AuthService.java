package com.example.cityticket.service;

import java.time.LocalDate;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.cityticket.dto.RegisterRequest;
import com.example.cityticket.entity.Role;
import com.example.cityticket.entity.User;
import com.example.cityticket.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	@Transactional
	public User registerPassenger(RegisterRequest request) {
		return registerPassenger(
				request.email(),
				request.password(),
				request.firstName(),
				request.lastName(),
				request.dateOfBirth());
	}

	@Transactional
	public User registerPassenger(String email, String rawPassword, String firstName,
			String lastName, LocalDate dateOfBirth) {
		if (userRepository.existsByEmail(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
		}
		User user = new User(
				email,
				passwordEncoder.encode(rawPassword),
				firstName,
				lastName,
				dateOfBirth,
				Role.PASSENGER);
		return userRepository.save(user);
	}
}
