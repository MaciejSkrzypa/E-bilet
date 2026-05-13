package com.example.cityticket.inspection;

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

class InspectionIntegrationTest extends AbstractIntegrationTest {

	@Test
	void anonymousReturns401() throws Exception {
		mockMvc.perform(post("/api/inspection/check")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\",\"vehicleId\":" + firstVehicleId() + "}"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void passengerReturns403() throws Exception {
		String token = registerPassengerAndLogin("jan@example.com", "tajne123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(token))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + UUID.randomUUID() + "\",\"vehicleId\":" + firstVehicleId() + "}"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message", org.hamcrest.Matchers.containsString("insufficient role")));
	}

	@Test
		void validSingleInSameVehicle() throws Exception {
			String passenger = registerPassengerAndLogin("jan@example.com", "tajne123");
			topUp(passenger, "10.00");
			String code = purchaseTicket(passenger, offerId(TicketType.SINGLE, Fare.NORMAL, null));
			Long vid = firstVehicleId();
			validateOwnedTicket(passenger, code, vid);

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
			String code = purchaseTicket(passenger, offerId(TicketType.SINGLE, Fare.NORMAL, null));
			validateOwnedTicket(passenger, code, firstVehicleId());

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
		void singleValidatedOnPreviousDayIsInvalidEvenInSameVehicle() throws Exception {
			String passenger = registerPassengerAndLogin("jan@example.com", "tajne123");
			topUp(passenger, "10.00");
			String code = purchaseTicket(passenger, offerId(TicketType.SINGLE, Fare.NORMAL, null));
			Long vid = firstVehicleId();
			validateOwnedTicket(passenger, code, vid);

		var ticket = ticketRepository.findByCode(UUID.fromString(code)).orElseThrow();
		ticket.setValidatedAt(ticket.getValidatedAt().minusDays(10));
		ticketRepository.save(ticket);

		String inspector = createInspectorAndLogin("ins@example.com", "ins123");

		mockMvc.perform(post("/api/inspection/check")
				.header("Authorization", bearer(inspector))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"code\":\"" + code + "\",\"vehicleId\":" + vid + "}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.valid").value(false))
				.andExpect(jsonPath("$.reason", org.hamcrest.Matchers.containsString("validation day has passed")));
	}

	@Test
	void unpunchedSingleIsInvalid() throws Exception {
		String passenger = registerPassengerAndLogin("jan@example.com", "tajne123");
		topUp(passenger, "10.00");
		String code = purchaseTicket(passenger, offerId(TicketType.SINGLE, Fare.NORMAL, null));

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
			String code = purchaseTicket(passenger, offerId(TicketType.TIME, Fare.NORMAL, 60));
			validateOwnedTicket(passenger, code, firstVehicleId());

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
		LocalDate today = AppTime.today();
		String code = purchaseTicket(passenger, offerId(TicketType.PERIOD, Fare.NORMAL, null),
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
		LocalDate future = AppTime.today().plusDays(30);
		String code = purchaseTicket(passenger, offerId(TicketType.PERIOD, Fare.NORMAL, null),
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
