package com.example.cityticket.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
	public User registerPassenger(String username, String rawPassword) {
		if (userRepository.existsByUsername(username)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
		}
		User user = new User(username, passwordEncoder.encode(rawPassword), Role.PASSENGER);
		return userRepository.save(user);
	}
}
