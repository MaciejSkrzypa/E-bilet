package com.example.cityticket.kasownik;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import com.example.cityticket.AbstractIntegrationTest;
import com.example.cityticket.entity.Fare;
import com.example.cityticket.entity.TicketOffer;
import com.example.cityticket.entity.TicketType;
import com.example.cityticket.entity.Vehicle;
import com.example.cityticket.repository.TicketOfferRepository;
import com.example.cityticket.repository.VehicleRepository;
import com.fasterxml.jackson.databind.JsonNode;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class KasownikIntegrationTest extends AbstractIntegrationTest {

	@Autowired
	private TicketOfferRepository ticketOfferRepository;

	@Autowired
	private VehicleRepository vehicleRepository;

	private Long offerId(TicketType type, Fare fare, Integer durationMinutes) {
		return ticketOfferRepository.findAll().stream()
				.filter(o -> o.getType() == type && o.getFare() == fare
						&& java.util.Objects.equals(o.getDurationMinutes(), durationMinutes))
				.findFirst().map(TicketOffer::getId).orElseThrow();
	}

	private Long anyVehicleId() {
		return vehicleRepository.findAll().stream().findFirst().map(Vehicle::getId).orElseThrow();
	}

	private String purchaseTicket(String token, Long offerId, String validFrom, String validTo) throws Exception {
		String body = validFrom == null
				? "{\"offerId\":" + offerId + "}"
				: "{\"offerId\":" + offerId + ",\"validFrom\":\"" + validFrom + "\",\"validTo\":\"" + validTo + "\"}";
		MvcResult res = mockMvc.perform(post("/api/tickets")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated()).andReturn();
		JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
		return json.get("code").asText();
	}

	private void topUp(String token, String amount) throws Exception {
		mockMvc.perform(post("/api/account/topup")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"amount\": " + amount + "}"))
				.andExpect(status().isOk());
	}

	@Test
	void validatesSingleTicketAndAttachesVehicle() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		String code = purchaseTicket(token, offerId(TicketType.SINGLE, Fare.NORMAL, null), null, null);
		Long vid = anyVehicleId();

		mockMvc.perform(post("/api/kasownik/validate")
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
		String code = purchaseTicket(token, offerId(TicketType.TIME, Fare.NORMAL, 30), null, null);
		Long vid = anyVehicleId();

		mockMvc.perform(post("/api/kasownik/validate")
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
		LocalDate today = LocalDate.now();
		String code = purchaseTicket(token, offerId(TicketType.PERIOD, Fare.NORMAL, null),
				today.toString(), today.plusDays(7).toString());

		mockMvc.perform(post("/api/kasownik/validate")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + anyVehicleId() + "}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("PERIOD")));
	}

	@Test
	void doubleValidationReturns409() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		String code = purchaseTicket(token, offerId(TicketType.SINGLE, Fare.NORMAL, null), null, null);
		Long vid = anyVehicleId();
		String body = "{\"code\":\"" + code + "\",\"vehicleId\":" + vid + "}";

		mockMvc.perform(post("/api/kasownik/validate").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isOk());
		mockMvc.perform(post("/api/kasownik/validate").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("already validated")));
	}

	@Test
	void unknownTicketCodeReturns404() throws Exception {
		mockMvc.perform(post("/api/kasownik/validate")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\",\"vehicleId\":" + anyVehicleId() + "}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Ticket not found"));
	}

	@Test
	void unknownVehicleIdReturns404() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(token, "10.00");
		String code = purchaseTicket(token, offerId(TicketType.SINGLE, Fare.NORMAL, null), null, null);

		mockMvc.perform(post("/api/kasownik/validate")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\": 99999}"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.message").value("Vehicle not found"));
	}

	@Test
	void emptyBodyReturns400WithFieldErrors() throws Exception {
		mockMvc.perform(post("/api/kasownik/validate")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors").isArray());
	}

	@Test
	void kasownikDoesNotRequireAuth() throws Exception {
		mockMvc.perform(post("/api/kasownik/validate")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\",\"vehicleId\":1}"))
				.andExpect(status().isNotFound()); // 404 (ticket nie istnieje), nie 401/403
	}
}
