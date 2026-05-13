package com.example.cityticket.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

import com.example.cityticket.dto.TicketFilterStatus;
import com.example.cityticket.entity.Fare;
import com.example.cityticket.entity.Ticket;
import com.example.cityticket.entity.TicketOffer;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.entity.User;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TicketStatusRulesTest {

	private final TicketStatusRules ticketStatusRules = new TicketStatusRules();

	@Test
	void recognizesStatusesForSingleTimeAndPeriodTickets() {
		LocalDate today = LocalDate.of(2026, 5, 13);
		LocalDateTime now = LocalDateTime.of(2026, 5, 13, 12, 0);

		Ticket requiresValidation = singleTicket();
		Ticket activeTime = timeTicket(30);
		activeTime.setValidatedAt(now.minusMinutes(10));

		Ticket activePeriod = periodTicket();
		activePeriod.setValidFrom(today.minusDays(1));
		activePeriod.setValidTo(today.plusDays(2));

		assertTrue(ticketStatusRules.matchesStatus(requiresValidation, TicketFilterStatus.REQUIRES_VALIDATION, today, now));
		assertTrue(ticketStatusRules.matchesStatus(activeTime, TicketFilterStatus.ACTIVE, today, now));
		assertTrue(ticketStatusRules.matchesStatus(activeTime, TicketFilterStatus.VALIDATED, today, now));
		assertTrue(ticketStatusRules.matchesStatus(activePeriod, TicketFilterStatus.ACTIVE, today, now));
		assertFalse(ticketStatusRules.matchesStatus(activePeriod, TicketFilterStatus.REQUIRES_VALIDATION, today, now));
	}

	@Test
	void timeTicketIsInactiveAfterItsDurationPasses() {
		LocalDateTime validationTime = LocalDateTime.of(2026, 5, 13, 10, 0);
		Ticket ticket = timeTicket(30);
		ticket.setValidatedAt(validationTime);

		assertTrue(ticketStatusRules.isTimeActive(ticket, validationTime.plusMinutes(30)));
		assertFalse(ticketStatusRules.isTimeActive(ticket, validationTime.plusMinutes(31)));
	}

	private Ticket singleTicket() {
		return new Ticket(owner(), new TicketOffer(TicketType.SINGLE, Fare.NORMAL, java.math.BigDecimal.valueOf(4.40), null));
	}

	private Ticket timeTicket(int durationMinutes) {
		return new Ticket(owner(), new TicketOffer(TicketType.TIME, Fare.NORMAL, java.math.BigDecimal.valueOf(5.00), durationMinutes));
	}

	private Ticket periodTicket() {
		return new Ticket(owner(), new TicketOffer(TicketType.PERIOD, Fare.NORMAL, java.math.BigDecimal.valueOf(5.00), null));
	}

	private User owner() {
		return new User("test@example.com", "hash", "Jan", "Test", LocalDate.of(1990, 1, 1),
				com.example.cityticket.entity.Role.PASSENGER);
	}
}
