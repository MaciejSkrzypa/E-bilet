package com.example.cityticket.kasownik;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.example.cityticket.AbstractIntegrationTest;
import com.example.cityticket.entity.Fare;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.util.AppTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class KasownikIntegrationTest extends AbstractIntegrationTest {

	@Test
	void validatesSingleTicketAndAttachesVehicle() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		String code = purchaseTicket(token, offerId(TicketType.SINGLE, Fare.NORMAL, null));
		Long vid = firstVehicleId();

		mockMvc.perform(post("/api/kasownik/validate")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + vid + "}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.validatedAt").exists())
				.andExpect(jsonPath("$.validatedVehicleId").value(vid));
	}

	@Test
	void validatesTimeTicket() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		String code = purchaseTicket(token, offerId(TicketType.TIME, Fare.NORMAL, 30));
		Long vid = firstVehicleId();

		mockMvc.perform(post("/api/kasownik/validate")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + vid + "}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.type").value("TIME"))
				.andExpect(jsonPath("$.durationMinutes").value(30));
	}

	@Test
	void rejectsValidationOfPeriodTicket() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "100.00");
		LocalDate today = AppTime.today();
		String code = purchaseTicket(token, offerId(TicketType.PERIOD, Fare.NORMAL, null),
				today.toString(), today.plusDays(7).toString());

		mockMvc.perform(post("/api/kasownik/validate")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + firstVehicleId() + "}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("PERIOD")));
	}

	@Test
	void doubleValidationReturns409() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		String code = purchaseTicket(token, offerId(TicketType.SINGLE, Fare.NORMAL, null));
		Long vid = firstVehicleId();
		String body = "{\"code\":\"" + code + "\",\"vehicleId\":" + vid + "}";

		mockMvc.perform(post("/api/kasownik/validate")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content(body))
				.andExpect(status().isOk());
		mockMvc.perform(post("/api/kasownik/validate")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content(body))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("already validated")));
	}

	@Test
	void unknownTicketCodeReturns404() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(post("/api/kasownik/validate")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\",\"vehicleId\":" + firstVehicleId() + "}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Ticket not found"));
	}

	@Test
	void unknownVehicleIdReturns404() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		String code = purchaseTicket(token, offerId(TicketType.SINGLE, Fare.NORMAL, null));

		mockMvc.perform(post("/api/kasownik/validate")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\": 99999}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Vehicle not found"));
	}

	@Test
	void emptyBodyReturns400WithFieldErrors() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(post("/api/kasownik/validate")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors").isArray());
	}

	@Test
	void passengerCannotValidateAnotherUsersTicket() throws Exception {
		String owner = registerPassengerAndLogin("owner@example.com", "tajne123");
		String otherPassenger = registerPassengerAndLogin("other@example.com", "tajne123");
		topUp(owner, "10.00");
		String code = purchaseTicket(owner, offerId(TicketType.SINGLE, Fare.NORMAL, null));

		mockMvc.perform(post("/api/kasownik/validate")
				.header("Authorization", bearer(otherPassenger))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + firstVehicleId() + "}"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message").value("Ticket does not belong to authenticated user"));
	}

	@Test
	void kasownikRequiresPassengerAuth() throws Exception {
		mockMvc.perform(post("/api/kasownik/validate")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\",\"vehicleId\":" + firstVehicleId() + "}"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void integrationKasownikValidatesWithoutJwtAndUsesConfiguredVehicle() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		String code = purchaseTicket(token, offerId(TicketType.SINGLE, Fare.NORMAL, null));

		mockMvc.perform(post("/api/integrations/kasownik/validate")
				.header("X-Kasownik-Key", kasownikIntegrationApiKey())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.validatedAt").exists())
				.andExpect(jsonPath("$.validatedVehicleLabel").value("T-100"));
	}

	@Test
	void integrationKasownikRequiresApiKey() throws Exception {
		mockMvc.perform(post("/api/integrations/kasownik/validate")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\"}"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void integrationKasownikRejectsInvalidApiKey() throws Exception {
		mockMvc.perform(post("/api/integrations/kasownik/validate")
				.header("X-Kasownik-Key", "wrong-key")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\"}"))
				.andExpect(status().isUnauthorized());
	}
}
