package com.example.cityticket.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.dto.PageResponse;
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
	public PageResponse<TransactionResponse> transactions(
			Authentication auth,
			@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
		return PageResponse.from(accountService.history(auth.getName(), pageable));
	}
}
