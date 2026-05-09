package com.example.cityticket.inspection;

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

class InspectionIntegrationTest extends AbstractIntegrationTest {

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

	private Long firstVehicleId() {
		return vehicleRepository.findAll().stream().findFirst().map(Vehicle::getId).orElseThrow();
	}

	private Long secondVehicleId() {
		return vehicleRepository.findAll().stream().skip(1).findFirst().map(Vehicle::getId).orElseThrow();
	}

	private void topUp(String token, String amount) throws Exception {
		mockMvc.perform(post("/api/account/topup")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"amount\": " + amount + "}"))
				.andExpect(status().isOk());
	}

	private String purchase(String token, Long offerId, String validFrom, String validTo) throws Exception {
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

	private void punch(String code, Long vehicleId) throws Exception {
		mockMvc.perform(post("/api/kasownik/validate")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + vehicleId + "}"))
				.andExpect(status().isOk());
	}

	@Test
	void anonymousReturns401() throws Exception {
		mockMvc.perform(post("/api/inspection/check")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\",\"vehicleId\":1}"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void passengerReturns403() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\",\"vehicleId\":1}"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("insufficient role")));
	}

	@Test
	void validSingleInSameVehicle() throws Exception {
		String passenger = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(passenger, "10.00");
		String code = purchase(passenger, offerId(TicketType.SINGLE, Fare.NORMAL, null), null, null);
		Long vid = firstVehicleId();
		punch(code, vid);

		String inspector = createInspectorAndLogin("ins@example.com", "ins123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(inspector))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + vid + "}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.valid").value(true))
				.andExpect(jsonPath("$.reason", org.hamcrest.Matchers.containsString("valid in this vehicle")));
	}

	@Test
	void invalidSingleInDifferentVehicle() throws Exception {
		String passenger = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(passenger, "10.00");
		String code = purchase(passenger, offerId(TicketType.SINGLE, Fare.NORMAL, null), null, null);
		punch(code, firstVehicleId());

		String inspector = createInspectorAndLogin("ins@example.com", "ins123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(inspector))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + secondVehicleId() + "}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.valid").value(false))
				.andExpect(jsonPath("$.reason", org.hamcrest.Matchers.containsString("different vehicle")));
	}

	@Test
	void unpunchedSingleIsInvalid() throws Exception {
		String passenger = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(passenger, "10.00");
		String code = purchase(passenger, offerId(TicketType.SINGLE, Fare.NORMAL, null), null, null);

		String inspector = createInspectorAndLogin("ins@example.com", "ins123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(inspector))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + firstVehicleId() + "}"))
				.andExpect(jsonPath("$.valid").value(false))
				.andExpect(jsonPath("$.reason", org.hamcrest.Matchers.containsString("not been validated")));
	}

	@Test
	void validTimeWithinDuration() throws Exception {
		String passenger = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(passenger, "10.00");
		String code = purchase(passenger, offerId(TicketType.TIME, Fare.NORMAL, 60), null, null);
		punch(code, firstVehicleId());

		String inspector = createInspectorAndLogin("ins@example.com", "ins123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(inspector))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + secondVehicleId() + "}"))
				.andExpect(jsonPath("$.valid").value(true));
	}

	@Test
	void validPeriodWithinRange() throws Exception {
		String passenger = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(passenger, "100.00");
		LocalDate today = LocalDate.now();
		String code = purchase(passenger, offerId(TicketType.PERIOD, Fare.NORMAL, null),
				today.toString(), today.plusDays(7).toString());

		String inspector = createInspectorAndLogin("ins@example.com", "ins123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(inspector))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + firstVehicleId() + "}"))
				.andExpect(jsonPath("$.valid").value(true))
				.andExpect(jsonPath("$.reason", org.hamcrest.Matchers.containsString("Period")));
	}

	@Test
	void invalidPeriodOutsideRange() throws Exception {
		String passenger = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(passenger, "100.00");
		LocalDate future = LocalDate.now().plusDays(30);
		String code = purchase(passenger, offerId(TicketType.PERIOD, Fare.NORMAL, null),
				future.toString(), future.plusDays(7).toString());

		String inspector = createInspectorAndLogin("ins@example.com", "ins123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(inspector))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + firstVehicleId() + "}"))
				.andExpect(jsonPath("$.valid").value(false))
				.andExpect(jsonPath("$.reason", org.hamcrest.Matchers.containsString("outside")));
	}

	@Test
	void unknownCodeReturnsValidFalseNotError() throws Exception {
		String inspector = createInspectorAndLogin("ins@example.com", "ins123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(inspector))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\",\"vehicleId\":" + firstVehicleId() + "}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.valid").value(false))
				.andExpect(jsonPath("$.reason").value("Ticket not found"))
				.andExpect(jsonPath("$.ticket").doesNotExist());
	}

	@Test
	void unknownInspectionVehicleReturns400() throws Exception {
		String inspector = createInspectorAndLogin("ins@example.com", "ins123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(inspector))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\",\"vehicleId\": 99999}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Inspection vehicle not found"));
	}
}
