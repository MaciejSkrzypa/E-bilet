package com.example.cityticket.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.cityticket.entity.Fare;
import com.example.cityticket.entity.Role;
import com.example.cityticket.entity.TicketOffer;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.entity.User;
import com.example.cityticket.entity.Vehicle;
import com.example.cityticket.repository.TicketOfferRepository;
import com.example.cityticket.repository.UserRepository;
import com.example.cityticket.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

	private final UserRepository userRepository;
	private final VehicleRepository vehicleRepository;
	private final TicketOfferRepository ticketOfferRepository;
	private final PasswordEncoder passwordEncoder;

	@Value("${app.seed.inspector.email}")
	private String inspectorEmail;

	@Value("${app.seed.inspector.password}")
	private String inspectorPassword;

	@Value("${app.seed.inspector.first-name}")
	private String inspectorFirstName;

	@Value("${app.seed.inspector.last-name}")
	private String inspectorLastName;

	@Value("${app.seed.inspector.date-of-birth}")
	private String inspectorDateOfBirth;

	@Override
	public void run(String... args) {
		seedInspector();
		seedVehicles();
		seedOffers();
	}

	private void seedInspector() {
		if (userRepository.existsByEmail(inspectorEmail)) {
			log.info("Inspector '{}' already exists — skipping seed.", inspectorEmail);
			return;
		}
		User inspector = new User(
				inspectorEmail,
				passwordEncoder.encode(inspectorPassword),
				inspectorFirstName,
				inspectorLastName,
				LocalDate.parse(inspectorDateOfBirth),
				Role.INSPECTOR);
		userRepository.save(inspector);
		log.info("Seeded inspector account '{}'.", inspectorEmail);
	}

	private void seedVehicles() {
		if (vehicleRepository.count() > 0) {
			log.info("Vehicles already present — skipping seed.");
			return;
		}
		List<Vehicle> vehicles = List.of(
				new Vehicle("T-100"),
				new Vehicle("T-101"),
				new Vehicle("T-102"),
				new Vehicle("B-200"),
				new Vehicle("B-201"),
				new Vehicle("B-202"));
		vehicleRepository.saveAll(vehicles);
		log.info("Seeded {} vehicles.", vehicles.size());
	}

	private void seedOffers() {
		if (ticketOfferRepository.count() > 0) {
			log.info("Ticket offers already present — skipping seed.");
			return;
		}
		List<TicketOffer> offers = List.of(
				new TicketOffer(TicketType.SINGLE, Fare.NORMAL, new BigDecimal("4.40"), null),
				new TicketOffer(TicketType.SINGLE, Fare.REDUCED, new BigDecimal("2.20"), null),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, new BigDecimal("3.40"), 30),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, new BigDecimal("1.70"), 30),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, new BigDecimal("5.00"), 60),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, new BigDecimal("2.50"), 60),
				new TicketOffer(TicketType.PERIOD, Fare.NORMAL, new BigDecimal("5.00"), null),
				new TicketOffer(TicketType.PERIOD, Fare.REDUCED, new BigDecimal("2.50"), null));
		ticketOfferRepository.saveAll(offers);
		log.info("Seeded {} ticket offers.", offers.size());
	}
}
