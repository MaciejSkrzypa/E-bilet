package com.example.cityticket.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cityticket.dto.VehicleResponse;
import com.example.cityticket.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VehicleService {

	private final VehicleRepository vehicleRepository;

	@Transactional(readOnly = true)
	public Page<VehicleResponse> list(String query, Pageable pageable) {
		String normalizedQuery = query == null ? "" : query.trim();
		if (normalizedQuery.isEmpty()) {
			return vehicleRepository.findAll(pageable).map(VehicleResponse::from);
		}
		return vehicleRepository.findAllByLabelContainingIgnoreCase(normalizedQuery, pageable)
				.map(VehicleResponse::from);
	}
}
