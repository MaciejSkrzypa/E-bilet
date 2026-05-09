package com.example.cityticket.service;

import java.math.BigDecimal;
import java.util.List;

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
	public UserResponse me(String username) {
		return UserResponse.from(loadUser(username));
	}

	@Transactional
	public UserResponse topUp(String username, BigDecimal amount) {
		User user = loadUser(username);
		user.setBalance(user.getBalance().add(amount));
		transactionRepository.save(new Transaction(user, TransactionType.TOPUP, amount, null));
		return UserResponse.from(user);
	}

	@Transactional(readOnly = true)
	public List<TransactionResponse> history(String username) {
		User user = loadUser(username);
		return transactionRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream()
				.map(TransactionResponse::from)
				.toList();
	}

	private User loadUser(String username) {
		return userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
	}
}
