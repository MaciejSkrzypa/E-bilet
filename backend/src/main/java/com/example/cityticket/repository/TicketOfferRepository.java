package com.example.cityticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.example.cityticket.entity.TicketOffer;

public interface TicketOfferRepository extends JpaRepository<TicketOffer, Long>, JpaSpecificationExecutor<TicketOffer> {
}
