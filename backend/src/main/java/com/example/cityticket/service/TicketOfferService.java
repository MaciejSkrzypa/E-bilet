package com.example.cityticket.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cityticket.dto.TicketOfferResponse;
import com.example.cityticket.entity.TicketOffer;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.repository.TicketOfferRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TicketOfferService {

	private final TicketOfferRepository ticketOfferRepository;

	@Transactional(readOnly = true)
	public Page<TicketOfferResponse> listActive(List<TicketType> types, Pageable pageable) {
		Specification<TicketOffer> spec = isActive();
		if (types != null && !types.isEmpty()) {
			spec = spec.and(typeIn(types));
		}
		return ticketOfferRepository.findAll(spec, pageable).map(TicketOfferResponse::from);
	}

	private static Specification<TicketOffer> isActive() {
		return (root, query, cb) -> cb.isTrue(root.get("active"));
	}

	private static Specification<TicketOffer> typeIn(List<TicketType> types) {
		return (root, query, cb) -> root.get("type").in(types);
	}
}
