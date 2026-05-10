package com.example.cityticket.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cityticket.entity.Vehicle;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

	Page<Vehicle> findAllByLabelContainingIgnoreCase(String query, Pageable pageable);
}
