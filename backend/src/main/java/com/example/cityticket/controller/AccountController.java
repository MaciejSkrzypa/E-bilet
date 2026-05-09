package com.example.cityticket.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.dto.TopUpRequest;
import com.example.cityticket.dto.TransactionResponse;
import com.example.cityticket.dto.UserResponse;
import com.example.cityticket.service.AccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

	private final AccountService accountService;

	@GetMapping("/me")
	public UserResponse me(Authentication auth) {
		return accountService.me(auth.getName());
	}

	@PostMapping("/topup")
	public UserResponse topUp(Authentication auth, @RequestBody @Valid TopUpRequest request) {
		return accountService.topUp(auth.getName(), request.amount());
	}

	@GetMapping("/transactions")
	public List<TransactionResponse> transactions(Authentication auth) {
		return accountService.history(auth.getName());
	}
}
