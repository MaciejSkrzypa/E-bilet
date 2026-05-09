package com.example.cityticket.auth;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.example.cityticket.AbstractIntegrationTest;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends AbstractIntegrationTest {

	private static final String VALID_REGISTER = """
			{"email":"jan@example.com","password":"tajne123","firstName":"Jan","lastName":"Kowalski","dateOfBirth":"1995-04-12"}
			""";

	@Test
	void registersPassengerWithCorrectFields() throws Exception {
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.email").value("jan@example.com"))
				.andExpect(jsonPath("$.firstName").value("Jan"))
				.andExpect(jsonPath("$.lastName").value("Kowalski"))
				.andExpect(jsonPath("$.dateOfBirth").value("1995-04-12"))
				.andExpect(jsonPath("$.role").value("PASSENGER"))
				.andExpect(jsonPath("$.balance").value(0.00));
	}

	@Test
	void rejectsDuplicateEmail() throws Exception {
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.status").value(409))
				.andExpect(jsonPath("$.message").value("Email already registered"));
	}

	@Test
	void rejectsInvalidEmail() throws Exception {
		String body = VALID_REGISTER.replace("jan@example.com", "nie-jest-emailem");
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.status").value(400))
				.andExpect(jsonPath("$.errors", hasItem(org.hamcrest.Matchers.containsString("email"))));
	}

	@Test
	void rejectsShortPassword() throws Exception {
		String body = VALID_REGISTER.replace("tajne123", "abc");
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasItem(org.hamcrest.Matchers.containsString("password"))));
	}

	@Test
	void rejectsFutureDateOfBirth() throws Exception {
		String body = VALID_REGISTER.replace("1995-04-12", "2099-01-01");
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasItem(org.hamcrest.Matchers.containsString("dateOfBirth"))));
	}

	@Test
	void rejectsBlankFirstName() throws Exception {
		String body = VALID_REGISTER.replace("\"Jan\"", "\"\"");
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors", hasItem(org.hamcrest.Matchers.containsString("firstName"))));
	}

	@Test
	void loginReturnsTokenAndUserPayload() throws Exception {
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
				.andExpect(status().isCreated());

		String loginBody = """
				{"email":"jan@example.com","password":"tajne123"}
				""";
		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token", notNullValue()))
				.andExpect(jsonPath("$.expiresAt", notNullValue()))
				.andExpect(jsonPath("$.user.email").value("jan@example.com"))
				.andExpect(jsonPath("$.user.role").value("PASSENGER"));
	}

	@Test
	void loginWithBadPasswordReturns401() throws Exception {
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(VALID_REGISTER))
				.andExpect(status().isCreated());

		String body = """
				{"email":"jan@example.com","password":"zle-haslo"}
				""";
		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Invalid credentials"));
	}

	@Test
	void loginWithUnknownEmailReturns401() throws Exception {
		String body = """
				{"email":"nikt@example.com","password":"jakies-haslo"}
				""";
		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void protectedEndpointReturns401WithoutToken() throws Exception {
		mockMvc.perform(get("/api/account/me"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.status").value(401))
				.andExpect(jsonPath("$.error").value("Unauthorized"));
	}

	@Test
	void protectedEndpointReturns401WithGarbageToken() throws Exception {
		mockMvc.perform(get("/api/account/me").header("Authorization", "Bearer not-a-jwt"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("Invalid JWT")));
	}

	@Test
	void protectedEndpointWorksWithValidToken() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(get("/api/account/me").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("jan@example.com"));
	}

	@Test
	void malformedJsonReturns400() throws Exception {
		mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{not-json"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("Malformed")));
	}
}
