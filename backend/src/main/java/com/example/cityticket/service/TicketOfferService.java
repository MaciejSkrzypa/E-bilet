package com.example.cityticket.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cityticket.dto.TicketOfferResponse;
import com.example.cityticket.repository.TicketOfferRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TicketOfferService {

	private final TicketOfferRepository ticketOfferRepository;

	@Transactional(readOnly = true)
	public Page<TicketOfferResponse> listActive(Pageable pageable) {
		return ticketOfferRepository.findAllByActiveTrue(pageable).map(TicketOfferResponse::from);
	}
}
