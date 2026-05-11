package com.example.cityticket.service;

import java.time.LocalDate;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.cityticket.config.JwtTokenService;
import com.example.cityticket.dto.LoginRequest;
import com.example.cityticket.dto.LoginResponse;
import com.example.cityticket.dto.RegisterRequest;
import com.example.cityticket.dto.UserResponse;
import com.example.cityticket.entity.Role;
import com.example.cityticket.entity.User;
import com.example.cityticket.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private static final String EMAIL_ALREADY_REGISTERED = "Email already registered";
	private static final String INVALID_CREDENTIALS = "Invalid credentials";

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtTokenService jwtTokenService;

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
			throw new ResponseStatusException(HttpStatus.CONFLICT, EMAIL_ALREADY_REGISTERED);
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

	@Transactional(readOnly = true)
	public LoginResponse login(LoginRequest request) {
		Authentication authentication;
		try {
			authentication = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(request.email(), request.password()));
		} catch (AuthenticationException ex) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
		}

		User user = userRepository.findByEmail(authentication.getName())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS));

		String token = jwtTokenService.generate(user.getEmail(), user.getRole());
		return new LoginResponse(token, jwtTokenService.expirationOf(token), UserResponse.from(user));
	}
}
