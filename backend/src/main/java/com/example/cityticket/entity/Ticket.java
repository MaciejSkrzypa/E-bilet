package com.example.cityticket.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.AssertTrue;

import com.example.cityticket.util.AppTime;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Ticket {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, updatable = false)
	private UUID code;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "owner_id", nullable = false)
	private User owner;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "offer_id", nullable = false)
	private TicketOffer offer;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private TicketType type;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private Fare fare;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal price;

	@Column(name = "purchase_date", nullable = false, updatable = false)
	private LocalDateTime purchaseDate;

	@Column(name = "duration_minutes")
	private Integer durationMinutes;

	@Column(name = "valid_from")
	private LocalDate validFrom;

	@Column(name = "valid_to")
	private LocalDate validTo;

	@Column(name = "validated_at")
	private LocalDateTime validatedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "validated_vehicle_id")
	private Vehicle validatedVehicle;

	public Ticket(User owner, TicketOffer offer) {
		this.owner = owner;
		this.offer = offer;
		this.type = offer.getType();
		this.fare = offer.getFare();
		this.price = offer.getPrice();
		this.durationMinutes = offer.getDurationMinutes();
		this.code = UUID.randomUUID();
	}

	@PrePersist
	void setPurchaseDateIfMissing() {
		if (purchaseDate == null) {
			purchaseDate = AppTime.nowDateTime();
		}
	}

	@AssertTrue(message = "Ticket time fields must match its type")
	@Transient
	public boolean isTypeFieldsConsistent() {
		if (type == null) {
			return true;
		}
		return switch (type) {
			case SINGLE -> durationMinutes == null && validFrom == null && validTo == null;
			case TIME -> durationMinutes != null && validFrom == null && validTo == null;
			case PERIOD -> durationMinutes == null && validFrom != null && validTo != null;
		};
	}
}
