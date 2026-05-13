package com.example.cityticket;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;

import com.example.cityticket.entity.Role;
import com.example.cityticket.entity.Fare;
import com.example.cityticket.entity.TicketOffer;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.entity.User;
import com.example.cityticket.entity.Vehicle;
import com.example.cityticket.repository.TicketOfferRepository;
import com.example.cityticket.repository.TicketRepository;
import com.example.cityticket.repository.TransactionRepository;
import com.example.cityticket.repository.UserRepository;
import com.example.cityticket.repository.VehicleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public abstract class AbstractIntegrationTest {

	private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");
	private static final String KASOWNIK_INTEGRATION_API_KEY = "test-kasownik-integration-api-key";
	private static final String KASOWNIK_INTEGRATION_VEHICLE_LABEL = "T-100";

	static {
		POSTGRES.start();
	}

	@DynamicPropertySource
	static void registerDataSource(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
		registry.add("app.kasownik.integrations.clients[0].name", () -> "test-kasownik");
		registry.add("app.kasownik.integrations.clients[0].api-key", () -> KASOWNIK_INTEGRATION_API_KEY);
		registry.add("app.kasownik.integrations.clients[0].vehicle-label", () -> KASOWNIK_INTEGRATION_VEHICLE_LABEL);
	}

	@Autowired
	private WebApplicationContext webApplicationContext;

	protected MockMvc mockMvc;

	@Autowired
	protected ObjectMapper objectMapper;

	@Autowired
	protected UserRepository userRepository;

	@Autowired
	protected TicketRepository ticketRepository;

	@Autowired
	protected TransactionRepository transactionRepository;

	@Autowired
	protected TicketOfferRepository ticketOfferRepository;

	@Autowired
	protected VehicleRepository vehicleRepository;

	@Autowired
	protected PasswordEncoder passwordEncoder;

	@BeforeEach
	void setUpMockMvcAndCleanData() {
		mockMvc = MockMvcBuilders
				.webAppContextSetup(webApplicationContext)
				.apply(SecurityMockMvcConfigurers.springSecurity())
				.build();
		transactionRepository.deleteAll();
		ticketRepository.deleteAll();
		userRepository.deleteAll();
	}

	protected String registerPassengerAndLogin(String email, String password) throws Exception {
		String body = """
				{"email":"%s","password":"%s","firstName":"Jan","lastName":"Kowalski","dateOfBirth":"1995-04-12"}
				""".formatted(email, password);
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated());
		return login(email, password);
	}

	protected User createInspectorDirectly(String email, String password) {
		User inspector = new User(
				email,
				passwordEncoder.encode(password),
				"Test",
				"Inspector",
				LocalDate.of(1990, 1, 1),
				Role.INSPECTOR);
		return userRepository.save(inspector);
	}

	protected String createInspectorAndLogin(String email, String password) throws Exception {
		createInspectorDirectly(email, password);
		return login(email, password);
	}

	protected String login(String email, String password) throws Exception {
		String body = """
				{"email":"%s","password":"%s"}
				""".formatted(email, password);
		MvcResult result = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
		return json.get("token").asText();
	}

	protected String bearer(String token) {
		return "Bearer " + token;
	}

	protected Long offerId(TicketType type, Fare fare, Integer durationMinutes) {
		return ticketOfferRepository.findAll().stream()
				.filter(offer -> offer.getType() == type
						&& offer.getFare() == fare
						&& java.util.Objects.equals(offer.getDurationMinutes(), durationMinutes))
				.findFirst()
				.map(TicketOffer::getId)
				.orElseThrow();
	}

	protected Long firstVehicleId() {
		return vehicleIdAt(0);
	}

	protected Long secondVehicleId() {
		return vehicleIdAt(1);
	}

	protected void topUp(String token, String amount) throws Exception {
		mockMvc.perform(post("/api/account/topup")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"amount\": " + amount + "}"))
				.andExpect(status().isOk());
	}

	protected String purchaseTicket(String token, Long offerId) throws Exception {
		return purchaseTicket(token, offerId, (String) null, null);
	}

	protected String purchaseTicket(String token, Long offerId, LocalDate validFrom, LocalDate validTo) throws Exception {
		return purchaseTicket(
				token,
				offerId,
				validFrom != null ? validFrom.toString() : null,
				validTo != null ? validTo.toString() : null);
	}

	protected String purchaseTicket(String token, Long offerId, String validFrom, String validTo) throws Exception {
		String body = validFrom == null
				? "{\"offerId\":" + offerId + "}"
				: "{\"offerId\":" + offerId + ",\"validFrom\":\"" + validFrom + "\",\"validTo\":\"" + validTo + "\"}";
		MvcResult result = mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content(body))
				.andExpect(status().isCreated())
				.andReturn();

		JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
		return json.get("code").asText();
	}

	protected void validateTicket(String code, Long vehicleId) throws Exception {
		throw new UnsupportedOperationException("Use validateOwnedTicket or validateTicketAsIntegration instead");
	}

	protected void validateOwnedTicket(String token, String code, Long vehicleId) throws Exception {
		mockMvc.perform(post("/api/kasownik/validate")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + vehicleId + "}"))
				.andExpect(status().isOk());
	}

	protected void validateTicketAsIntegration(String code) throws Exception {
		mockMvc.perform(post("/api/integrations/kasownik/validate")
				.header("X-Kasownik-Key", KASOWNIK_INTEGRATION_API_KEY)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\"}"))
				.andExpect(status().isOk());
	}

	protected String kasownikIntegrationApiKey() {
		return KASOWNIK_INTEGRATION_API_KEY;
	}

	private Long vehicleIdAt(int index) {
		return vehicleRepository.findAll().stream()
				.skip(index)
				.findFirst()
				.map(Vehicle::getId)
				.orElseThrow();
	}
}
