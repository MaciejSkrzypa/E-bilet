package com.example.cityticket.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 254)
	private String email;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Column(name = "first_name", nullable = false, length = 64)
	private String firstName;

	@Column(name = "last_name", nullable = false, length = 64)
	private String lastName;

	@Column(name = "date_of_birth", nullable = false)
	private LocalDate dateOfBirth;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private Role role;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal balance = BigDecimal.ZERO;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	public User(String email, String passwordHash, String firstName, String lastName,
			LocalDate dateOfBirth, Role role) {
		this.email = email;
		this.passwordHash = passwordHash;
		this.firstName = firstName;
		this.lastName = lastName;
		this.dateOfBirth = dateOfBirth;
		this.role = role;
	}
}
