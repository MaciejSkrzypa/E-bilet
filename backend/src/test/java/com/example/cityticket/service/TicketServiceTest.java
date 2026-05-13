package com.example.cityticket.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import com.example.cityticket.dto.InspectionResponse;
import com.example.cityticket.dto.PurchaseRequest;
import com.example.cityticket.dto.TicketFilterStatus;
import com.example.cityticket.dto.TicketResponse;
import com.example.cityticket.entity.Fare;
import com.example.cityticket.entity.Role;
import com.example.cityticket.entity.Ticket;
import com.example.cityticket.entity.TicketOffer;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.entity.Transaction;
import com.example.cityticket.entity.User;
import com.example.cityticket.entity.Vehicle;
import com.example.cityticket.repository.TicketOfferRepository;
import com.example.cityticket.repository.TicketRepository;
import com.example.cityticket.repository.TransactionRepository;
import com.example.cityticket.repository.UserRepository;
import com.example.cityticket.repository.VehicleRepository;
import com.example.cityticket.util.AppTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

	@Mock
	private UserRepository userRepository;

	@Mock
	private TicketOfferRepository ticketOfferRepository;

	@Mock
	private TicketRepository ticketRepository;

	@Mock
	private TransactionRepository transactionRepository;

	@Mock
	private VehicleRepository vehicleRepository;

	private TicketService ticketService;

	@BeforeEach
	void setUp() {
		ticketService = new TicketService(
				userRepository,
				ticketOfferRepository,
				ticketRepository,
				transactionRepository,
				vehicleRepository,
				new TicketStatusRules());
	}

	@Test
	void purchaseComputesInclusivePeriodPriceAndCreatesTransaction() {
		User user = passenger("jan@example.com");
		user.setBalance(new BigDecimal("100.00"));

		TicketOffer offer = new TicketOffer(TicketType.PERIOD, Fare.NORMAL, new BigDecimal("5.00"), null);
		offer.setId(7L);

		LocalDate validFrom = AppTime.today();
		LocalDate validTo = validFrom.plusDays(2);

		when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
		when(ticketOfferRepository.findById(7L)).thenReturn(Optional.of(offer));
		when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> invocation.getArgument(0));
		when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

		TicketResponse response = ticketService.purchase(user.getEmail(), new PurchaseRequest(7L, validFrom, validTo));

		ArgumentCaptor<Ticket> ticketCaptor = ArgumentCaptor.forClass(Ticket.class);
		ArgumentCaptor<Transaction> transactionCaptor = ArgumentCaptor.forClass(Transaction.class);
		verify(ticketRepository).save(ticketCaptor.capture());
		verify(transactionRepository).save(transactionCaptor.capture());

		assertEquals(new BigDecimal("15.00"), response.price());
		assertEquals(validFrom, response.validFrom());
		assertEquals(validTo, response.validTo());
		assertEquals(new BigDecimal("85.00"), user.getBalance());
		assertEquals(new BigDecimal("15.00"), ticketCaptor.getValue().getPrice());
		assertEquals(new BigDecimal("15.00"), transactionCaptor.getValue().getAmount());
	}

	@Test
	void findMyTicketsFiltersByStatusesOnly() {
		User user = passenger("jan@example.com");
		user.setId(1L);

		LocalDate today = AppTime.today();
		LocalDateTime now = AppTime.nowDateTime();

		Ticket requiresValidation = singleTicket(user);
		requiresValidation.setId(11L);
		requiresValidation.setPurchaseDate(now.minusMinutes(3));

		Ticket validatedActiveTime = timeTicket(user, 30);
		validatedActiveTime.setId(12L);
		validatedActiveTime.setValidatedAt(now.minusMinutes(10));
		validatedActiveTime.setPurchaseDate(now.minusMinutes(2));

		Ticket activePeriod = periodTicket(user);
		activePeriod.setId(13L);
		activePeriod.setValidFrom(today);
		activePeriod.setValidTo(today.plusDays(2));
		activePeriod.setPurchaseDate(now.minusMinutes(1));

		Ticket futurePeriod = periodTicket(user);
		futurePeriod.setId(14L);
		futurePeriod.setValidFrom(today.plusDays(5));
		futurePeriod.setValidTo(today.plusDays(7));
		futurePeriod.setPurchaseDate(now.minusMinutes(4));

		PageRequest pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "purchaseDate"));

		when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
		when(ticketRepository.findAll(org.mockito.ArgumentMatchers.<Specification<Ticket>>any(), eq(pageable.getSort())))
				.thenReturn(List.of(activePeriod, validatedActiveTime, requiresValidation, futurePeriod));

		Page<TicketResponse> page = ticketService.findMyTickets(
				user.getEmail(),
				null,
				List.of(TicketFilterStatus.REQUIRES_VALIDATION),
				pageable);

		assertEquals(1, page.getTotalElements());
		assertEquals(1, page.getContent().size());
		assertEquals(List.of(requiresValidation.getCode()),
				page.getContent().stream().map(TicketResponse::code).toList());
	}

	@Test
	void inspectSingleRejectsTicketValidatedInDifferentVehicle() {
		Vehicle validatedVehicle = new Vehicle("T-100");
		validatedVehicle.setId(1L);

		Vehicle inspectionVehicle = new Vehicle("T-101");
		inspectionVehicle.setId(2L);

		User user = passenger("jan@example.com");
		Ticket ticket = singleTicket(user);
		ticket.setValidatedAt(AppTime.nowDateTime());
		ticket.setValidatedVehicle(validatedVehicle);
		UUID code = ticket.getCode();

		when(vehicleRepository.findById(2L)).thenReturn(Optional.of(inspectionVehicle));
		when(ticketRepository.findByCode(code)).thenReturn(Optional.of(ticket));

		InspectionResponse response = ticketService.inspect(code, 2L);

		assertFalse(response.valid());
		assertTrue(response.reason().contains("different vehicle"));
		assertEquals(code, response.ticket().code());
	}

	private User passenger(String email) {
		return new User(email, "hash", "Jan", "Test", LocalDate.of(1990, 1, 1), Role.PASSENGER);
	}

	private Ticket singleTicket(User owner) {
		return new Ticket(owner, new TicketOffer(TicketType.SINGLE, Fare.NORMAL, new BigDecimal("4.40"), null));
	}

	private Ticket timeTicket(User owner, int durationMinutes) {
		return new Ticket(owner, new TicketOffer(TicketType.TIME, Fare.NORMAL, new BigDecimal("5.00"), durationMinutes));
	}

	private Ticket periodTicket(User owner) {
		return new Ticket(owner, new TicketOffer(TicketType.PERIOD, Fare.NORMAL, new BigDecimal("5.00"), null));
	}
}
