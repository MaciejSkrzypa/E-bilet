package com.example.cityticket.service;

import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.cityticket.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String email) {
		return userRepository.findByEmail(email)
				.map(user -> User.withUsername(user.getEmail())
						.password(user.getPasswordHash())
						.authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
						.build())
				.orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
	}
}
