package com.example.cityticket.account;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.example.cityticket.AbstractIntegrationTest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AccountIntegrationTest extends AbstractIntegrationTest {

	@Test
	void meReturnsCurrentUser() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(get("/api/account/me").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("jan@example.com"))
				.andExpect(jsonPath("$.balance").value(0.00));
	}

	@Test
	void topUpAddsToBalanceAndCreatesTransaction() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(post("/api/account/topup")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"amount\": 50.00}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.balance").value(50.00));

		mockMvc.perform(post("/api/account/topup")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"amount\": 25.50}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.balance").value(75.50));

		mockMvc.perform(get("/api/account/transactions").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(2))
				.andExpect(jsonPath("$.content[0].type").value("TOPUP"))
				.andExpect(jsonPath("$.content[0].amount").value(25.50))
				.andExpect(jsonPath("$.content[1].amount").value(50.00));
	}

	@Test
	void rejectsZeroAmount() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(post("/api/account/topup")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"amount\": 0}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void rejectsNegativeAmount() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(post("/api/account/topup")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"amount\": -10}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void rejectsTooLargeAmount() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(post("/api/account/topup")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"amount\": 999999}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void transactionsArePaginated() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		for (int i = 0; i < 5; i++) {
			mockMvc.perform(post("/api/account/topup")
					.header("Authorization", bearer(token))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"amount\": 10.00}"))
					.andExpect(status().isOk());
		}

		mockMvc.perform(get("/api/account/transactions?size=2&page=0").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(5))
				.andExpect(jsonPath("$.totalPages").value(3))
				.andExpect(jsonPath("$.content.length()").value(2))
				.andExpect(jsonPath("$.first").value(true));

		mockMvc.perform(get("/api/account/transactions?size=2&page=2").header("Authorization", bearer(token)))
				.andExpect(jsonPath("$.content.length()").value(1))
				.andExpect(jsonPath("$.last").value(true));
	}

	@Test
	void emptyTransactionListForNewUser() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(get("/api/account/transactions").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(0))
				.andExpect(jsonPath("$.content.length()").value(0));
	}
}
