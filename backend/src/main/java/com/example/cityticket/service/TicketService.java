package com.example.cityticket.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.cityticket.dto.InspectionResponse;
import com.example.cityticket.dto.PurchaseRequest;
import com.example.cityticket.dto.TicketResponse;
import com.example.cityticket.entity.Ticket;
import com.example.cityticket.entity.TicketOffer;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.entity.Transaction;
import com.example.cityticket.entity.TransactionType;
import com.example.cityticket.entity.User;
import com.example.cityticket.entity.Vehicle;
import com.example.cityticket.repository.TicketOfferRepository;
import com.example.cityticket.repository.TicketRepository;
import com.example.cityticket.repository.TransactionRepository;
import com.example.cityticket.repository.UserRepository;
import com.example.cityticket.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TicketService {

	private final UserRepository userRepository;
	private final TicketOfferRepository ticketOfferRepository;
	private final TicketRepository ticketRepository;
	private final TransactionRepository transactionRepository;
	private final VehicleRepository vehicleRepository;

	@Transactional
	public TicketResponse purchase(String email, PurchaseRequest request) {
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

		TicketOffer offer = ticketOfferRepository.findById(request.offerId())
				.filter(TicketOffer::isActive)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found"));

		validateRequestAgainstOfferType(offer, request);

		BigDecimal totalPrice = computeTotalPrice(offer, request);

		if (user.getBalance().compareTo(totalPrice) < 0) {
			throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
					"Insufficient balance: required " + totalPrice + ", available " + user.getBalance());
		}

		user.setBalance(user.getBalance().subtract(totalPrice));

		Ticket ticket = new Ticket(user, offer);
		ticket.setPrice(totalPrice);
		if (offer.getType() == TicketType.PERIOD) {
			ticket.setValidFrom(request.validFrom());
			ticket.setValidTo(request.validTo());
		}
		ticketRepository.save(ticket);

		transactionRepository.save(new Transaction(user, TransactionType.PURCHASE, totalPrice, ticket));

		return TicketResponse.from(ticket);
	}

	@Transactional(readOnly = true)
	public Page<TicketResponse> findMyTickets(String email, List<TicketType> types, Boolean validated,
			Pageable pageable) {
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

		Specification<Ticket> spec = ownedBy(user.getId());
		if (types != null && !types.isEmpty()) {
			spec = spec.and(typeIn(types));
		}
		if (validated != null) {
			spec = spec.and(validated ? hasBeenValidated() : notValidated());
		}
		return ticketRepository.findAll(spec, pageable).map(TicketResponse::from);
	}

	private static Specification<Ticket> ownedBy(Long ownerId) {
		return (root, query, cb) -> cb.equal(root.get("owner").get("id"), ownerId);
	}

	private static Specification<Ticket> typeIn(List<TicketType> types) {
		return (root, query, cb) -> root.get("type").in(types);
	}

	private static Specification<Ticket> hasBeenValidated() {
		return (root, query, cb) -> cb.isNotNull(root.get("validatedAt"));
	}

	private static Specification<Ticket> notValidated() {
		return (root, query, cb) -> cb.isNull(root.get("validatedAt"));
	}

	@Transactional
	public TicketResponse validate(UUID code, Long vehicleId) {
		Ticket ticket = ticketRepository.findByCode(code)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found"));

		if (ticket.getType() == TicketType.PERIOD) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"PERIOD tickets do not require validation (no kasowanie)");
		}
		if (ticket.getValidatedAt() != null) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Ticket already validated at " + ticket.getValidatedAt());
		}

		Vehicle vehicle = vehicleRepository.findById(vehicleId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

		ticket.setValidatedAt(LocalDateTime.now());
		ticket.setValidatedVehicle(vehicle);
		return TicketResponse.from(ticket);
	}

	@Transactional(readOnly = true)
	public InspectionResponse inspect(UUID code, Long inspectionVehicleId) {
		Vehicle inspectionVehicle = vehicleRepository.findById(inspectionVehicleId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
						"Inspection vehicle not found"));

		Ticket ticket = ticketRepository.findByCode(code).orElse(null);
		if (ticket == null) {
			return new InspectionResponse(false, "Ticket not found", null);
		}

		LocalDateTime now = LocalDateTime.now();
		LocalDate today = now.toLocalDate();
		String reason;
		boolean valid;

		switch (ticket.getType()) {
			case PERIOD -> {
				if (!today.isBefore(ticket.getValidFrom()) && !today.isAfter(ticket.getValidTo())) {
					valid = true;
					reason = "Period ticket within validity range";
				} else {
					valid = false;
					reason = "Inspection date outside [validFrom, validTo]";
				}
			}
			case SINGLE -> {
				if (ticket.getValidatedAt() == null) {
					valid = false;
					reason = "Ticket has not been validated (kasowanie missing)";
				} else if (!ticket.getValidatedVehicle().getId().equals(inspectionVehicle.getId())) {
					valid = false;
					reason = "Single ticket validated in a different vehicle ("
							+ ticket.getValidatedVehicle().getLabel() + ")";
				} else {
					valid = true;
					reason = "Single ticket valid in this vehicle";
				}
			}
			case TIME -> {
				if (ticket.getValidatedAt() == null) {
					valid = false;
					reason = "Ticket has not been validated (kasowanie missing)";
				} else {
					LocalDateTime expiresAt = ticket.getValidatedAt().plusMinutes(ticket.getDurationMinutes());
					if (now.isAfter(expiresAt)) {
						valid = false;
						reason = "Time ticket expired at " + expiresAt;
					} else {
						valid = true;
						reason = "Time ticket valid until " + expiresAt;
					}
				}
			}
			default -> {
				valid = false;
				reason = "Unknown ticket type";
			}
		}

		return new InspectionResponse(valid, reason, TicketResponse.from(ticket));
	}

	private void validateRequestAgainstOfferType(TicketOffer offer, PurchaseRequest request) {
		switch (offer.getType()) {
			case SINGLE, TIME -> {
				if (request.validFrom() != null || request.validTo() != null) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"validFrom/validTo are not allowed for " + offer.getType() + " tickets");
				}
			}
			case PERIOD -> {
				if (request.validFrom() == null || request.validTo() == null) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"validFrom and validTo are required for PERIOD tickets");
				}
				if (request.validFrom().isAfter(request.validTo())) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"validFrom must be on or before validTo");
				}
				if (request.validFrom().isBefore(LocalDate.now())) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"validFrom cannot be in the past");
				}
			}
		}
	}

	private BigDecimal computeTotalPrice(TicketOffer offer, PurchaseRequest request) {
		if (offer.getType() != TicketType.PERIOD) {
			return offer.getPrice();
		}
		long days = ChronoUnit.DAYS.between(request.validFrom(), request.validTo()) + 1;
		return offer.getPrice().multiply(BigDecimal.valueOf(days));
	}
}
