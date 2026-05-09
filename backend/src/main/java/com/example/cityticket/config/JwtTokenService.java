package com.example.cityticket.config;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.cityticket.entity.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

@Service
public class JwtTokenService {

	private final SecretKey key;
	private final Duration expiration;

	public JwtTokenService(
			@Value("${app.jwt.secret}") String secret,
			@Value("${app.jwt.expiration-hours}") long expirationHours) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expiration = Duration.ofHours(expirationHours);
	}

	public String generate(String username, Role role) {
		Instant now = Instant.now();
		Instant expiresAt = now.plus(expiration);
		return Jwts.builder()
				.subject(username)
				.claim("role", role.name())
				.issuedAt(Date.from(now))
				.expiration(Date.from(expiresAt))
				.signWith(key)
				.compact();
	}

	public Claims parse(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public Instant expirationOf(String token) {
		return parse(token).getExpiration().toInstant();
	}
}
