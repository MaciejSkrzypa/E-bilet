package com.example.cityticket.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cityticket.entity.Ticket;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

	Optional<Ticket> findByCode(UUID code);

	List<Ticket> findAllByOwnerIdOrderByPurchaseDateDesc(Long ownerId);
}
