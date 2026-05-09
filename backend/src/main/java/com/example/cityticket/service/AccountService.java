package com.example.cityticket.service;

import java.math.BigDecimal;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.cityticket.dto.TransactionResponse;
import com.example.cityticket.dto.UserResponse;
import com.example.cityticket.entity.Transaction;
import com.example.cityticket.entity.TransactionType;
import com.example.cityticket.entity.User;
import com.example.cityticket.repository.TransactionRepository;
import com.example.cityticket.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccountService {

	private final UserRepository userRepository;
	private final TransactionRepository transactionRepository;

	@Transactional(readOnly = true)
	public UserResponse me(String email) {
		return UserResponse.from(loadUser(email));
	}

	@Transactional
	public UserResponse topUp(String email, BigDecimal amount) {
		User user = loadUser(email);
		user.setBalance(user.getBalance().add(amount));
		transactionRepository.save(new Transaction(user, TransactionType.TOPUP, amount, null));
		return UserResponse.from(user);
	}

	@Transactional(readOnly = true)
	public Page<TransactionResponse> history(String email, Pageable pageable) {
		User user = loadUser(email);
		return transactionRepository.findAllByUserId(user.getId(), pageable).map(TransactionResponse::from);
	}

	private User loadUser(String email) {
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
	}
}
