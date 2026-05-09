package com.example.cityticket.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

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
	public TicketResponse purchase(String username, PurchaseRequest request) {
		User user = userRepository.findByUsername(username)
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
	public List<TicketResponse> findMyTickets(String username) {
		User user = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
		return ticketRepository.findAllByOwnerIdOrderByPurchaseDateDesc(user.getId()).stream()
				.map(TicketResponse::from)
				.toList();
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
		String reason;
		boolean valid;

		switch (ticket.getType()) {
			case PERIOD -> {
				if (!now.isBefore(ticket.getValidFrom()) && !now.isAfter(ticket.getValidTo())) {
					valid = true;
					reason = "Period ticket within validity range";
				} else {
					valid = false;
					reason = "Inspection time outside [validFrom, validTo]";
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
				if (!request.validFrom().isBefore(request.validTo())) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
							"validFrom must be strictly before validTo");
				}
				if (request.validFrom().isBefore(LocalDateTime.now())) {
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
		long minutes = ChronoUnit.MINUTES.between(request.validFrom(), request.validTo());
		BigDecimal minutesBd = BigDecimal.valueOf(minutes);
		BigDecimal unitBd = BigDecimal.valueOf(offer.getPriceUnitMinutes());
		BigDecimal units = minutesBd.divide(unitBd, 4, RoundingMode.HALF_UP);
		return offer.getPrice().multiply(units).setScale(2, RoundingMode.HALF_UP);
	}
}
