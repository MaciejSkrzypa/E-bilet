package com.example.cityticket.entity;

import java.math.BigDecimal;

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
@Table(name = "ticket_offers")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TicketOffer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private TicketType type;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private Fare fare;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal price;

	@Column(name = "duration_minutes")
	private Integer durationMinutes;

	@Column(nullable = false)
	private boolean active = true;

	public TicketOffer(TicketType type, Fare fare, BigDecimal price, Integer durationMinutes) {
		this.type = type;
		this.fare = fare;
		this.price = price;
		this.durationMinutes = durationMinutes;
	}
}
