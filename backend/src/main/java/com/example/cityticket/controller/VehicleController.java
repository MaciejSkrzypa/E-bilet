package com.example.cityticket.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cityticket.dto.PageResponse;
import com.example.cityticket.dto.VehicleResponse;
import com.example.cityticket.service.VehicleService;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@SecurityRequirements
public class VehicleController {

	private final VehicleService vehicleService;

	@GetMapping
	public PageResponse<VehicleResponse> list(
			@RequestParam(required = false) String query,
			@PageableDefault(size = 10, sort = "label", direction = Sort.Direction.ASC) Pageable pageable) {
		return PageResponse.from(vehicleService.list(query, pageable));
	}
}
