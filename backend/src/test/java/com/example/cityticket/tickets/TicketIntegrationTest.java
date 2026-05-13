package com.example.cityticket.tickets;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.example.cityticket.AbstractIntegrationTest;
import com.example.cityticket.entity.Fare;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.util.AppTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TicketIntegrationTest extends AbstractIntegrationTest {

	@Test
	void purchasesSingleAndDeductsBalance() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "100.00");
		Long single = offerId(TicketType.SINGLE, Fare.NORMAL, null);

		mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + single + "}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.code").exists())
				.andExpect(jsonPath("$.type").value("SINGLE"))
				.andExpect(jsonPath("$.price").value(4.40))
				.andExpect(jsonPath("$.durationMinutes").doesNotExist())
				.andExpect(jsonPath("$.validatedAt").doesNotExist());

		mockMvc.perform(get("/api/account/me").header("Authorization", bearer(token)))
				.andExpect(jsonPath("$.balance").value(95.60));
	}

	@Test
	void purchasesTimeWithDurationFromOffer() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "20.00");
		Long time60 = offerId(TicketType.TIME, Fare.NORMAL, 60);

		mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + time60 + "}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.type").value("TIME"))
				.andExpect(jsonPath("$.durationMinutes").value(60))
				.andExpect(jsonPath("$.price").value(5.00));
	}

	@Test
	void purchasesPeriodAndComputesPricePerDay() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "100.00");
		Long period = offerId(TicketType.PERIOD, Fare.NORMAL, null);
		LocalDate from = AppTime.today();
		LocalDate to = from.plusDays(6); // 7 dni inkluzywnie → 7 × 5.00 = 35.00

		mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + period + ",\"validFrom\":\"" + from + "\",\"validTo\":\"" + to + "\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.type").value("PERIOD"))
				.andExpect(jsonPath("$.price").value(35.00))
				.andExpect(jsonPath("$.validFrom").value(from.toString()))
				.andExpect(jsonPath("$.validTo").value(to.toString()))
				.andExpect(jsonPath("$.durationMinutes").doesNotExist());
	}

	@Test
	void singleDayPeriodCostsOneDay() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "100.00");
		Long period = offerId(TicketType.PERIOD, Fare.NORMAL, null);
		LocalDate today = AppTime.today();

		mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + period + ",\"validFrom\":\"" + today + "\",\"validTo\":\"" + today + "\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.price").value(5.00));
	}

	@Test
	void rejectsSinglePurchaseWithDates() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		Long single = offerId(TicketType.SINGLE, Fare.NORMAL, null);

		mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + single + ",\"validFrom\":\"2026-05-09\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("not allowed")));
	}

	@Test
	void rejectsPeriodPurchaseWithoutDates() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		Long period = offerId(TicketType.PERIOD, Fare.NORMAL, null);

		mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + period + "}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("required")));
	}

	@Test
	void rejectsPeriodWithReversedDates() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		Long period = offerId(TicketType.PERIOD, Fare.NORMAL, null);
		LocalDate from = AppTime.today().plusDays(5);
		LocalDate to = AppTime.today();

		mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + period + ",\"validFrom\":\"" + from + "\",\"validTo\":\"" + to + "\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("on or before")));
	}

	@Test
	void rejectsPeriodInThePast() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		Long period = offerId(TicketType.PERIOD, Fare.NORMAL, null);

		mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + period + ",\"validFrom\":\"2020-01-01\",\"validTo\":\"2020-01-07\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("past")));
	}

	@Test
	void rejectsPurchaseWithUnknownOffer() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");

		mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\": 99999}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void rejectsPurchaseWithInsufficientBalance() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		Long single = offerId(TicketType.SINGLE, Fare.NORMAL, null);

		mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + single + "}"))
				.andExpect(status().isPaymentRequired())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("Insufficient balance")));
	}

	@Test
	void myTicketsListsAllPurchasedSorted() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "200.00");
		Long single = offerId(TicketType.SINGLE, Fare.NORMAL, null);
		Long time = offerId(TicketType.TIME, Fare.NORMAL, 30);

		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"offerId\":" + single + "}"))
				.andExpect(status().isCreated());
		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"offerId\":" + time + "}"))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/tickets").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(2));
	}

	@Test
	void filtersByTypeSingleOnly() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "200.00");
		Long single = offerId(TicketType.SINGLE, Fare.NORMAL, null);
		Long time = offerId(TicketType.TIME, Fare.NORMAL, 30);

		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"offerId\":" + single + "}"))
				.andExpect(status().isCreated());
		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"offerId\":" + time + "}"))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/tickets?type=SINGLE").header("Authorization", bearer(token)))
				.andExpect(jsonPath("$.totalElements").value(1))
				.andExpect(jsonPath("$.content[0].type").value("SINGLE"));
	}

	@Test
	void filtersByMultipleTypes() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "200.00");
		Long single = offerId(TicketType.SINGLE, Fare.NORMAL, null);
		Long time = offerId(TicketType.TIME, Fare.NORMAL, 30);
		Long period = offerId(TicketType.PERIOD, Fare.NORMAL, null);

		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"offerId\":" + single + "}"))
				.andExpect(status().isCreated());
		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"offerId\":" + time + "}"))
				.andExpect(status().isCreated());
		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content(
						"{\"offerId\":" + period + ",\"validFrom\":\"" + AppTime.today()
								+ "\",\"validTo\":\"" + AppTime.today() + "\"}"))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/tickets?type=SINGLE,TIME").header("Authorization", bearer(token)))
				.andExpect(jsonPath("$.totalElements").value(2));
	}

	@Test
	void filtersByRequiresValidationStatusShowsOnlyUnpunchedSingleAndTimeTickets() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "200.00");
		Long single = offerId(TicketType.SINGLE, Fare.NORMAL, null);

		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content("{\"offerId\":" + single + "}"))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/tickets?status=REQUIRES_VALIDATION").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(1));
	}

	@Test
	void filtersByActiveStatus() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "300.00");
		Long single = offerId(TicketType.SINGLE, Fare.NORMAL, null);
		Long time = offerId(TicketType.TIME, Fare.NORMAL, 30);
		Long period = offerId(TicketType.PERIOD, Fare.NORMAL, null);
		LocalDate today = AppTime.today();

		var singlePurchase = mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + single + "}"))
				.andExpect(status().isCreated())
				.andReturn();

		String singleCode = objectMapper.readTree(singlePurchase.getResponse().getContentAsString()).get("code").asText();

			validateOwnedTicket(token, singleCode, firstVehicleId());

		var timePurchase = mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + time + "}"))
				.andExpect(status().isCreated())
				.andReturn();

		String timeCode = objectMapper.readTree(timePurchase.getResponse().getContentAsString()).get("code").asText();

			validateOwnedTicket(token, timeCode, firstVehicleId());

		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + period + ",\"validFrom\":\"" + today + "\",\"validTo\":\"" + today.plusDays(7) + "\"}"))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + period + ",\"validFrom\":\"" + today.plusDays(2) + "\",\"validTo\":\"" + today.plusDays(5) + "\"}"))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/tickets?status=ACTIVE").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(3))
				.andExpect(jsonPath("$.content[0].type").exists())
				.andExpect(jsonPath("$.content[*].type").isArray());
	}

	@Test
	void filtersByMultipleStatuses() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "300.00");
		Long single = offerId(TicketType.SINGLE, Fare.NORMAL, null);
		Long time = offerId(TicketType.TIME, Fare.NORMAL, 30);
		Long period = offerId(TicketType.PERIOD, Fare.NORMAL, null);
		LocalDate today = AppTime.today();

		var singlePurchase = mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + single + "}"))
				.andExpect(status().isCreated())
				.andReturn();

		String singleCode = objectMapper.readTree(singlePurchase.getResponse().getContentAsString()).get("code").asText();

		var timePurchase = mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + time + "}"))
				.andExpect(status().isCreated())
				.andReturn();

		String timeCode = objectMapper.readTree(timePurchase.getResponse().getContentAsString()).get("code").asText();

			validateOwnedTicket(token, timeCode, firstVehicleId());

		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + period + ",\"validFrom\":\"" + today + "\",\"validTo\":\"" + today.plusDays(7) + "\"}"))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/tickets").header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"offerId\":" + period + ",\"validFrom\":\"" + today.plusDays(3) + "\",\"validTo\":\"" + today.plusDays(5) + "\"}"))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/tickets?status=ACTIVE").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(2));

		mockMvc.perform(get("/api/tickets?status=REQUIRES_VALIDATION").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(1))
				.andExpect(jsonPath("$.content[0].code").value(singleCode));

		mockMvc.perform(get("/api/tickets?status=ACTIVE,REQUIRES_VALIDATION").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(3));

		mockMvc.perform(get("/api/tickets?status=VALIDATED").header("Authorization", bearer(token)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(1))
				.andExpect(jsonPath("$.content[0].code").value(timeCode));
	}

	@Test
	void rejectsBadEnumInTypeFilter() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(get("/api/tickets?type=NIEZNANY").header("Authorization", bearer(token)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void rejectsRemovedValidatedFilter() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(get("/api/tickets?validated=false").header("Authorization", bearer(token)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void rejectsRemovedActiveFilter() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(get("/api/tickets?active=true").header("Authorization", bearer(token)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void anonymousCannotListMyTickets() throws Exception {
		mockMvc.perform(get("/api/tickets"))
				.andExpect(status().isUnauthorized());
	}
}
