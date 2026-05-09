package com.example.cityticket.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cityticket.entity.Vehicle;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
}
