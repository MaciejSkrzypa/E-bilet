package com.example.cityticket.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.example.cityticket.entity.Transaction;
import com.example.cityticket.entity.TransactionType;

public record TransactionResponse(
		Long id,
		TransactionType type,
		BigDecimal amount,
		LocalDateTime createdAt,
		Long ticketId,
		UUID ticketCode) {

	public static TransactionResponse from(Transaction tx) {
		Long ticketId = tx.getTicket() != null ? tx.getTicket().getId() : null;
		UUID ticketCode = tx.getTicket() != null ? tx.getTicket().getCode() : null;
		return new TransactionResponse(
				tx.getId(),
				tx.getType(),
				tx.getAmount(),
				tx.getCreatedAt(),
				ticketId,
				ticketCode);
	}
}
