package com.example.cityticket.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cityticket.entity.TicketOffer;

public interface TicketOfferRepository extends JpaRepository<TicketOffer, Long> {

	List<TicketOffer> findAllByActiveTrue();
}
