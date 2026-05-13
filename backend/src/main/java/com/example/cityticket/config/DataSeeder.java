package com.example.cityticket.config;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.cityticket.entity.Fare;
import com.example.cityticket.entity.Role;
import com.example.cityticket.entity.Ticket;
import com.example.cityticket.entity.TicketOffer;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.entity.Transaction;
import com.example.cityticket.entity.TransactionType;
import com.example.cityticket.entity.User;
import com.example.cityticket.entity.Vehicle;
import com.example.cityticket.repository.TicketOfferRepository;
import com.example.cityticket.repository.TicketRepository;
import com.example.cityticket.repository.TransactionRepository;
import com.example.cityticket.repository.UserRepository;
import com.example.cityticket.repository.VehicleRepository;
import com.example.cityticket.util.AppTime;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

	private final UserRepository userRepository;
	private final VehicleRepository vehicleRepository;
	private final TicketOfferRepository ticketOfferRepository;
	private final TicketRepository ticketRepository;
	private final TransactionRepository transactionRepository;
	private final PasswordEncoder passwordEncoder;

	@Value("${app.seed.inspector.password}")
	private String sharedPassword;

	@Override
	public void run(String... args) {
		Map<String, User> users = seedUsers();
		Map<String, Vehicle> vehicles = seedVehicles();
		Map<OfferKey, TicketOffer> offers = seedOffers();
		seedPassengerData(users, vehicles, offers);
	}

	private Map<String, User> seedUsers() {
		if (userRepository.count() > 0) {
			log.info("Users already present — skipping seed.");
			return userRepository.findAll().stream().collect(LinkedHashMap::new, (map, user) -> map.put(user.getEmail(), user),
					Map::putAll);
		}

		String passwordHash = passwordEncoder.encode(sharedPassword);
		List<User> seededUsers = List.of(
				createUser("inspector1@example.com", passwordHash, "Jan", "Kontroler", LocalDate.of(1986, 4, 12),
						Role.INSPECTOR),
				createUser("inspector2@example.com", passwordHash, "Anna", "Bileter", LocalDate.of(1991, 9, 3),
						Role.INSPECTOR),
				createUser("passenger1@example.com", passwordHash, "Marta", "Nowak", LocalDate.of(1998, 2, 14),
						Role.PASSENGER),
				createUser("passenger2@example.com", passwordHash, "Tomasz", "Kowalski", LocalDate.of(1995, 7, 8),
						Role.PASSENGER),
				createUser("passenger3@example.com", passwordHash, "Karolina", "Wojcik", LocalDate.of(2001, 11, 27),
						Role.PASSENGER));

		List<User> savedUsers = userRepository.saveAll(seededUsers);
		log.info("Seeded {} user accounts (2 inspectors, 3 passengers).", savedUsers.size());

		Map<String, User> usersByEmail = new LinkedHashMap<>();
		for (User user : savedUsers) {
			usersByEmail.put(user.getEmail(), user);
		}
		return usersByEmail;
	}

	private Map<String, Vehicle> seedVehicles() {
		if (vehicleRepository.count() > 0) {
			log.info("Vehicles already present — skipping seed.");
			return vehiclesByLabel(vehicleRepository.findAll());
		}

		List<Vehicle> vehicles = List.of(
				new Vehicle("T-100"),
				new Vehicle("T-101"),
				new Vehicle("T-102"),
				new Vehicle("T-103"),
				new Vehicle("T-104"),
				new Vehicle("T-105"),
				new Vehicle("B-200"),
				new Vehicle("B-201"),
				new Vehicle("B-202"),
				new Vehicle("B-203"),
				new Vehicle("B-204"),
				new Vehicle("B-205"));

		List<Vehicle> savedVehicles = vehicleRepository.saveAll(vehicles);
		log.info("Seeded {} vehicles.", savedVehicles.size());

		return vehiclesByLabel(savedVehicles);
	}

	private Map<String, Vehicle> vehiclesByLabel(List<Vehicle> vehicles) {
		Map<String, Vehicle> vehiclesByLabel = new LinkedHashMap<>();
		for (Vehicle vehicle : vehicles) {
			Vehicle previous = vehiclesByLabel.putIfAbsent(vehicle.getLabel(), vehicle);
			if (previous != null) {
				throw new IllegalStateException("Duplicate vehicle label detected: " + vehicle.getLabel());
			}
		}
		return vehiclesByLabel;
	}

	private Map<OfferKey, TicketOffer> seedOffers() {
		if (ticketOfferRepository.count() > 0) {
			log.info("Ticket offers already present — skipping seed.");
			return ticketOfferRepository.findAll().stream().collect(LinkedHashMap::new,
					(map, offer) -> map.put(new OfferKey(offer.getType(), offer.getFare(), offer.getDurationMinutes()), offer),
					Map::putAll);
		}

		List<TicketOffer> offers = List.of(
				new TicketOffer(TicketType.SINGLE, Fare.NORMAL, amount("4.40"), null),
				new TicketOffer(TicketType.SINGLE, Fare.REDUCED, amount("2.20"), null),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, amount("2.80"), 15),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, amount("1.40"), 15),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, amount("3.40"), 30),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, amount("1.70"), 30),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, amount("4.20"), 45),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, amount("2.10"), 45),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, amount("5.00"), 60),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, amount("2.50"), 60),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, amount("6.80"), 90),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, amount("3.40"), 90),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, amount("8.20"), 120),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, amount("4.10"), 120),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, amount("11.00"), 180),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, amount("5.50"), 180),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, amount("17.50"), 360),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, amount("8.75"), 360),
				new TicketOffer(TicketType.TIME, Fare.NORMAL, amount("24.00"), 720),
				new TicketOffer(TicketType.TIME, Fare.REDUCED, amount("12.00"), 720),
				new TicketOffer(TicketType.PERIOD, Fare.NORMAL, amount("5.00"), null),
				new TicketOffer(TicketType.PERIOD, Fare.REDUCED, amount("2.50"), null));

		List<TicketOffer> savedOffers = ticketOfferRepository.saveAll(offers);
		log.info("Seeded {} ticket offers.", savedOffers.size());

		Map<OfferKey, TicketOffer> offersByKey = new LinkedHashMap<>();
		for (TicketOffer offer : savedOffers) {
			offersByKey.put(new OfferKey(offer.getType(), offer.getFare(), offer.getDurationMinutes()), offer);
		}
		return offersByKey;
	}

	private void seedPassengerData(Map<String, User> users, Map<String, Vehicle> vehicles,
			Map<OfferKey, TicketOffer> offers) {
		if (ticketRepository.count() > 0 || transactionRepository.count() > 0) {
			log.info("Tickets or transactions already present — skipping passenger activity seed.");
			return;
		}

		LocalDate today = AppTime.today();
		LocalDateTime now = AppTime.nowDateTime().withSecond(0).withNano(0);

		seedPassenger(
				users.get("passenger1@example.com"),
				List.of(
						new SeedTopUp(amount("200.00"), today.minusDays(20).atTime(8, 30)),
						new SeedTopUp(amount("50.00"), today.minusDays(1).atTime(18, 45))),
				List.of(
						new SeedTicket(new OfferKey(TicketType.PERIOD, Fare.NORMAL, null), today.minusDays(6).atTime(9, 15), null, null,
								today.minusDays(3), today.plusDays(27)),
						new SeedTicket(new OfferKey(TicketType.SINGLE, Fare.NORMAL, null), today.minusDays(2).atTime(7, 40), null, null,
								null, null),
						new SeedTicket(new OfferKey(TicketType.TIME, Fare.NORMAL, 60), now.minusMinutes(20), now.minusMinutes(15), "T-100",
								null, null),
						new SeedTicket(new OfferKey(TicketType.TIME, Fare.NORMAL, 180), today.minusDays(1).atTime(17, 25), null, null,
								null, null),
						new SeedTicket(new OfferKey(TicketType.SINGLE, Fare.REDUCED, null), today.minusDays(1).atTime(8, 10),
								today.minusDays(1).atTime(8, 15), "T-101", null, null),
						new SeedTicket(new OfferKey(TicketType.TIME, Fare.REDUCED, 30), today.minusDays(6).atTime(12, 0),
								today.minusDays(6).atTime(12, 4), "B-200", null, null)),
				vehicles,
				offers);

		seedPassenger(
				users.get("passenger2@example.com"),
				List.of(
						new SeedTopUp(amount("80.00"), today.minusDays(45).atTime(10, 0)),
						new SeedTopUp(amount("30.00"), today.minusDays(1).atTime(16, 30))),
				List.of(
						new SeedTicket(new OfferKey(TicketType.PERIOD, Fare.REDUCED, null), today.minusDays(25).atTime(9, 50), null, null,
								today.minusDays(20), today.minusDays(5)),
						new SeedTicket(new OfferKey(TicketType.TIME, Fare.REDUCED, 30), today.minusDays(1).atTime(11, 0),
								today.minusDays(1).atTime(11, 3), "B-201", null, null),
						new SeedTicket(new OfferKey(TicketType.TIME, Fare.NORMAL, 720), today.minusDays(2).atTime(13, 20), null, null,
								null, null),
						new SeedTicket(new OfferKey(TicketType.SINGLE, Fare.NORMAL, null), today.minusDays(3).atTime(7, 15), null, null,
								null, null),
						new SeedTicket(new OfferKey(TicketType.SINGLE, Fare.REDUCED, null), today.atTime(8, 20), today.atTime(8, 28),
								"T-102", null, null)),
				vehicles,
				offers);

		seedPassenger(
				users.get("passenger3@example.com"),
				List.of(
						new SeedTopUp(amount("200.00"), today.minusDays(10).atTime(9, 0)),
						new SeedTopUp(amount("50.00"), today.atTime(7, 45))),
				List.of(
						new SeedTicket(new OfferKey(TicketType.PERIOD, Fare.NORMAL, null), today.atTime(9, 10), null, null,
								today.plusDays(2), today.plusDays(32)),
						new SeedTicket(new OfferKey(TicketType.TIME, Fare.REDUCED, 720), now.minusHours(2), now.minusHours(1), "B-202",
								null, null),
						new SeedTicket(new OfferKey(TicketType.SINGLE, Fare.REDUCED, null), today.minusDays(4).atTime(6, 50), null, null,
								null, null),
						new SeedTicket(new OfferKey(TicketType.TIME, Fare.NORMAL, 90), today.minusDays(1).atTime(9, 40),
								today.minusDays(1).atTime(9, 45), "T-103", null, null),
						new SeedTicket(new OfferKey(TicketType.TIME, Fare.REDUCED, 45), today.minusDays(1).atTime(19, 15), null, null,
								null, null),
						new SeedTicket(new OfferKey(TicketType.SINGLE, Fare.NORMAL, null), today.atTime(12, 10), null, null, null, null)),
				vehicles,
				offers);
	}

	private void seedPassenger(User user, List<SeedTopUp> topUps, List<SeedTicket> tickets, Map<String, Vehicle> vehicles,
			Map<OfferKey, TicketOffer> offers) {
		BigDecimal balance = BigDecimal.ZERO;

		for (SeedTopUp topUp : topUps) {
			Transaction transaction = new Transaction(user, TransactionType.TOPUP, topUp.amount(), null);
			transaction.setCreatedAt(topUp.createdAt());
			transactionRepository.save(transaction);
			balance = balance.add(topUp.amount());
		}

		for (SeedTicket ticketSpec : tickets) {
			TicketOffer offer = offers.get(ticketSpec.offerKey());
			Ticket ticket = new Ticket(user, offer);
			ticket.setPurchaseDate(ticketSpec.purchaseDate());

			BigDecimal ticketPrice = offer.getPrice();
			if (offer.getType() == TicketType.PERIOD) {
				ticket.setValidFrom(ticketSpec.validFrom());
				ticket.setValidTo(ticketSpec.validTo());
				ticketPrice = offer.getPrice()
						.multiply(BigDecimal.valueOf(ChronoUnit.DAYS.between(ticketSpec.validFrom(), ticketSpec.validTo()) + 1));
			}
			ticket.setPrice(ticketPrice);

			if (ticketSpec.validatedAt() != null) {
				ticket.setValidatedAt(ticketSpec.validatedAt());
				ticket.setValidatedVehicle(vehicles.get(ticketSpec.vehicleLabel()));
			}

			ticketRepository.save(ticket);

			Transaction purchaseTransaction = new Transaction(user, TransactionType.PURCHASE, ticketPrice, ticket);
			purchaseTransaction.setCreatedAt(ticketSpec.purchaseDate().plusMinutes(1));
			transactionRepository.save(purchaseTransaction);

			balance = balance.subtract(ticketPrice);
		}

		user.setBalance(balance);
		userRepository.save(user);

		log.info("Seeded {} tickets and {} top-ups for passenger '{}'.", tickets.size(), topUps.size(), user.getEmail());
	}

	private static User createUser(String email, String passwordHash, String firstName, String lastName,
			LocalDate dateOfBirth, Role role) {
		return new User(email, passwordHash, firstName, lastName, dateOfBirth, role);
	}

	private static BigDecimal amount(String value) {
		return new BigDecimal(value);
	}

	private record OfferKey(TicketType type, Fare fare, Integer durationMinutes) {
	}

	private record SeedTopUp(BigDecimal amount, LocalDateTime createdAt) {
	}

	private record SeedTicket(OfferKey offerKey, LocalDateTime purchaseDate, LocalDateTime validatedAt,
			String vehicleLabel, LocalDate validFrom, LocalDate validTo) {
	}
}
