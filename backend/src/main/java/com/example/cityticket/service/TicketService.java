package com.example.cityticket.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.cityticket.dto.InspectionResponse;
import com.example.cityticket.dto.PurchaseRequest;
import com.example.cityticket.dto.TicketFilterStatus;
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
import com.example.cityticket.util.AppTime;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TicketService {

	private static final String USER_NOT_FOUND = "User not found";
	private static final String OFFER_NOT_FOUND = "Offer not found";
	private static final String TICKET_NOT_FOUND = "Ticket not found";
	private static final String TICKET_NOT_OWNED_BY_AUTHENTICATED_USER = "Ticket does not belong to authenticated user";
	private static final String VEHICLE_NOT_FOUND = "Vehicle not found";
	private static final String INSPECTION_VEHICLE_NOT_FOUND = "Inspection vehicle not found";

	private final UserRepository userRepository;
	private final TicketOfferRepository ticketOfferRepository;
	private final TicketRepository ticketRepository;
	private final TransactionRepository transactionRepository;
	private final VehicleRepository vehicleRepository;
	private final TicketStatusRules ticketStatusRules;

	@Transactional
	public TicketResponse purchase(String email, PurchaseRequest request) {
		User user = loadUser(email);
		TicketOffer offer = loadActiveOffer(request.offerId());

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
	public Page<TicketResponse> findMyTickets(String email, List<TicketType> types, List<TicketFilterStatus> statuses,
			Pageable pageable) {
		User user = loadUser(email);

		Specification<Ticket> spec = ownedBy(user.getId());
		LocalDate today = AppTime.today();
		LocalDateTime now = AppTime.nowDateTime();

		if (types != null && !types.isEmpty()) {
			spec = spec.and(typeIn(types));
		}

		List<TicketResponse> filteredTickets = ticketRepository.findAll(spec, pageable.getSort()).stream()
				.filter(ticket -> matchesStatusFilter(ticket, statuses, today, now))
				.map(TicketResponse::from)
				.toList();

		return toPage(filteredTickets, pageable);
	}

	private static Specification<Ticket> ownedBy(Long ownerId) {
		return (root, query, cb) -> cb.equal(root.get("owner").get("id"), ownerId);
	}

	private static Specification<Ticket> typeIn(List<TicketType> types) {
		return (root, query, cb) -> root.get("type").in(types);
	}

	private boolean matchesStatusFilter(Ticket ticket, List<TicketFilterStatus> statuses, LocalDate today, LocalDateTime now) {
		return statuses == null || statuses.isEmpty() || ticketStatusRules.matchesAnyStatus(ticket, statuses, today, now);
	}

	private Page<TicketResponse> toPage(List<TicketResponse> filteredTickets, Pageable pageable) {
		if (pageable.isUnpaged()) {
			return new PageImpl<>(filteredTickets);
		}

		int start = (int) pageable.getOffset();
		if (start >= filteredTickets.size()) {
			return new PageImpl<>(List.of(), pageable, filteredTickets.size());
		}

		int end = Math.min(start + pageable.getPageSize(), filteredTickets.size());
		return new PageImpl<>(filteredTickets.subList(start, end), pageable, filteredTickets.size());
	}

	@Transactional
	public TicketResponse validateOwnedByUser(String email, UUID code, Long vehicleId) {
		Ticket ticket = loadTicket(code);
		Vehicle vehicle = loadVehicle(vehicleId);
		ensureOwnedByAuthenticatedUser(ticket, email);
		return validateTicket(ticket, vehicle);
	}

	@Transactional
	public TicketResponse validateForIntegrationClient(UUID code, String vehicleLabel) {
		Ticket ticket = loadTicket(code);
		Vehicle vehicle = loadVehicleByLabel(vehicleLabel);
		return validateTicket(ticket, vehicle);
	}

	private TicketResponse validateTicket(Ticket ticket, Vehicle vehicle) {
		ensureCanBeValidated(ticket);

		ticket.setValidatedAt(AppTime.nowDateTime());
		ticket.setValidatedVehicle(vehicle);
		return TicketResponse.from(ticket);
	}

	@Transactional(readOnly = true)
	public InspectionResponse inspect(UUID code, Long inspectionVehicleId) {
		Vehicle inspectionVehicle = loadInspectionVehicle(inspectionVehicleId);
		Ticket ticket = findTicketOrNull(code);
		if (ticket == null) {
			return new InspectionResponse(false, "Ticket not found", null);
		}

		LocalDateTime now = AppTime.nowDateTime();
		LocalDate today = AppTime.today();
		InspectionDecision decision = inspectTicket(ticket, inspectionVehicle, today, now);
		return new InspectionResponse(decision.valid(), decision.reason(), TicketResponse.from(ticket));
	}

	private User loadUser(String email) {
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, USER_NOT_FOUND));
	}

	private TicketOffer loadActiveOffer(Long offerId) {
		return ticketOfferRepository.findById(offerId)
				.filter(TicketOffer::isActive)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, OFFER_NOT_FOUND));
	}

	private Ticket loadTicket(UUID code) {
		return ticketRepository.findByCode(code)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, TICKET_NOT_FOUND));
	}

	private Ticket findTicketOrNull(UUID code) {
		return ticketRepository.findByCode(code).orElse(null);
	}

	private Vehicle loadVehicle(Long vehicleId) {
		return vehicleRepository.findById(vehicleId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, VEHICLE_NOT_FOUND));
	}

	private Vehicle loadVehicleByLabel(String vehicleLabel) {
		return vehicleRepository.findByLabel(vehicleLabel)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, VEHICLE_NOT_FOUND));
	}

	private Vehicle loadInspectionVehicle(Long vehicleId) {
		return vehicleRepository.findById(vehicleId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, INSPECTION_VEHICLE_NOT_FOUND));
	}

	private void ensureOwnedByAuthenticatedUser(Ticket ticket, String email) {
		if (!ticket.getOwner().getEmail().equals(email)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, TICKET_NOT_OWNED_BY_AUTHENTICATED_USER);
		}
	}

	private void ensureCanBeValidated(Ticket ticket) {
		if (ticket.getType() == TicketType.PERIOD) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"PERIOD tickets do not require validation (no kasowanie)");
		}
		if (ticket.getValidatedAt() != null) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Ticket already validated at " + ticket.getValidatedAt());
		}
	}

	private InspectionDecision inspectTicket(Ticket ticket, Vehicle inspectionVehicle, LocalDate today,
			LocalDateTime now) {
		return switch (ticket.getType()) {
			case PERIOD -> inspectPeriodTicket(ticket, today);
			case SINGLE -> inspectSingleTicket(ticket, inspectionVehicle, today);
			case TIME -> inspectTimeTicket(ticket, now);
		};
	}

	private InspectionDecision inspectPeriodTicket(Ticket ticket, LocalDate today) {
		if (ticketStatusRules.isPeriodActive(ticket, today)) {
			return new InspectionDecision(true, "Period ticket within validity range");
		}
		return new InspectionDecision(false, "Inspection date outside [validFrom, validTo]");
	}

	private InspectionDecision inspectSingleTicket(Ticket ticket, Vehicle inspectionVehicle, LocalDate today) {
		if (!ticketStatusRules.hasBeenValidated(ticket)) {
			return new InspectionDecision(false, "Ticket has not been validated (kasowanie missing)");
		}
		if (!ticketStatusRules.isSingleActive(ticket, today)) {
			return new InspectionDecision(false, "Single ticket expired: validation day has passed");
		}
		if (!ticket.getValidatedVehicle().getId().equals(inspectionVehicle.getId())) {
			return new InspectionDecision(false, "Single ticket validated in a different vehicle ("
					+ ticket.getValidatedVehicle().getLabel() + ")");
		}
		return new InspectionDecision(true, "Single ticket valid in this vehicle");
	}

	private InspectionDecision inspectTimeTicket(Ticket ticket, LocalDateTime now) {
		if (!ticketStatusRules.hasBeenValidated(ticket)) {
			return new InspectionDecision(false, "Ticket has not been validated (kasowanie missing)");
		}

		LocalDateTime expiresAt = ticketStatusRules.expiresAt(ticket);
		if (expiresAt == null) {
			return new InspectionDecision(false, "Time ticket is missing validation time or duration");
		}
		if (now.isAfter(expiresAt)) {
			return new InspectionDecision(false, "Time ticket expired at " + expiresAt);
		}
		return new InspectionDecision(true, "Time ticket valid until " + expiresAt);
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
				if (request.validFrom().isBefore(AppTime.today())) {
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

	private record InspectionDecision(boolean valid, String reason) {
	}
}
