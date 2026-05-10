package com.example.cityticket.dto;

import com.example.cityticket.entity.Vehicle;

public record VehicleResponse(
		Long id,
		String label) {

	public static VehicleResponse from(Vehicle vehicle) {
		return new VehicleResponse(vehicle.getId(), vehicle.getLabel());
	}
}
