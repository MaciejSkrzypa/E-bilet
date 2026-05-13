package com.example.cityticket.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.dto.LoginRequest;
import com.example.cityticket.dto.LoginResponse;
import com.example.cityticket.dto.RegisterRequest;
import com.example.cityticket.dto.UserResponse;
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

	@PostMapping("/register")
	public ResponseEntity<UserResponse> register(@RequestBody @Valid RegisterRequest request) {
		return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerPassenger(request));
	}

	@PostMapping("/login")
	public LoginResponse login(@RequestBody @Valid LoginRequest request) {
		return authService.login(request);
	}
}
