package com.example.cityticket.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.cityticket.dto.LoginRequest;
import com.example.cityticket.dto.LoginResponse;
import com.example.cityticket.dto.RegisterRequest;
import com.example.cityticket.dto.UserResponse;
import com.example.cityticket.config.JwtTokenService;
import com.example.cityticket.entity.User;
import com.example.cityticket.repository.UserRepository;
import com.example.cityticket.service.AuthService;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@SecurityRequirements
public class AuthController {

	private final AuthService authService;
	private final AuthenticationManager authenticationManager;
	private final JwtTokenService jwtTokenService;
	private final UserRepository userRepository;

	@PostMapping("/register")
	public ResponseEntity<UserResponse> register(@RequestBody @Valid RegisterRequest request) {
		User user = authService.registerPassenger(request.username(), request.password());
		return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
	}

	@PostMapping("/login")
	public LoginResponse login(@RequestBody @Valid LoginRequest request) {
		Authentication authentication;
		try {
			authentication = authenticationManager.authenticate(
					new UsernamePasswordAuthenticationToken(request.username(), request.password()));
		} catch (AuthenticationException ex) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
		}

		User user = userRepository.findByUsername(authentication.getName())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

		String token = jwtTokenService.generate(user.getUsername(), user.getRole());
		return new LoginResponse(token, jwtTokenService.expirationOf(token), UserResponse.from(user));
	}
}
