package com.example.cityticket.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cityticket.entity.TicketOffer;

public interface TicketOfferRepository extends JpaRepository<TicketOffer, Long> {

	Page<TicketOffer> findAllByActiveTrue(Pageable pageable);
}
