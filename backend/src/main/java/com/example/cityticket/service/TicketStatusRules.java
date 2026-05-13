package com.example.cityticket.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;

import org.springframework.stereotype.Component;

import com.example.cityticket.dto.TicketFilterStatus;
import com.example.cityticket.entity.Ticket;
import com.example.cityticket.entity.TicketType;

@Component
public class TicketStatusRules {

	public boolean hasBeenValidated(Ticket ticket) {
		return ticket.getValidatedAt() != null;
	}

	public boolean requiresValidation(Ticket ticket) {
		return ticket.getType() != TicketType.PERIOD && !hasBeenValidated(ticket);
	}

	public boolean isCurrentlyActive(Ticket ticket, LocalDate today, LocalDateTime now) {
		return switch (ticket.getType()) {
			case PERIOD -> isPeriodActive(ticket, today);
			case SINGLE -> isSingleActive(ticket, today);
			case TIME -> isTimeActive(ticket, now);
		};
	}

	public boolean isPeriodActive(Ticket ticket, LocalDate today) {
		return ticket.getValidFrom() != null
				&& ticket.getValidTo() != null
				&& !today.isBefore(ticket.getValidFrom())
				&& !today.isAfter(ticket.getValidTo());
	}

	public boolean isSingleActive(Ticket ticket, LocalDate today) {
		return ticket.getValidatedAt() != null && ticket.getValidatedAt().toLocalDate().equals(today);
	}

	public boolean isTimeActive(Ticket ticket, LocalDateTime now) {
		LocalDateTime expiresAt = expiresAt(ticket);
		return expiresAt != null && !now.isAfter(expiresAt);
	}

	public LocalDateTime expiresAt(Ticket ticket) {
		if (ticket.getValidatedAt() == null || ticket.getDurationMinutes() == null) {
			return null;
		}
		return ticket.getValidatedAt().plusMinutes(ticket.getDurationMinutes());
	}

	public boolean matchesAnyStatus(Ticket ticket, Collection<TicketFilterStatus> statuses, LocalDate today,
			LocalDateTime now) {
		return statuses.stream().anyMatch(status -> matchesStatus(ticket, status, today, now));
	}

	public boolean matchesStatus(Ticket ticket, TicketFilterStatus status, LocalDate today, LocalDateTime now) {
		return switch (status) {
			case ACTIVE -> isCurrentlyActive(ticket, today, now);
			case REQUIRES_VALIDATION -> requiresValidation(ticket);
			case VALIDATED -> hasBeenValidated(ticket);
		};
	}
}
