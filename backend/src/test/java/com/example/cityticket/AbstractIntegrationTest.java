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
import com.example.cityticket.entity.User;
import com.example.cityticket.repository.TicketRepository;
import com.example.cityticket.repository.TransactionRepository;
import com.example.cityticket.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public abstract class AbstractIntegrationTest {

	private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

	static {
		POSTGRES.start();
	}

	@DynamicPropertySource
	static void registerDataSource(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
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
}
