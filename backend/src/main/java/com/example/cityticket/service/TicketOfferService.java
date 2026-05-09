package com.example.cityticket.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cityticket.entity.TicketOffer;
import com.example.cityticket.repository.TicketOfferRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TicketOfferService {

	private final TicketOfferRepository ticketOfferRepository;

	@Transactional(readOnly = true)
	public List<TicketOffer> listActive() {
		return ticketOfferRepository.findAllByActiveTrue();
	}
}
