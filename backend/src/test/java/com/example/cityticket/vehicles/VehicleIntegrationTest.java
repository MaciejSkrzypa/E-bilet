package com.example.cityticket.vehicles;

import org.junit.jupiter.api.Test;

import com.example.cityticket.AbstractIntegrationTest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class VehicleIntegrationTest extends AbstractIntegrationTest {

	@Test
	void listingIsPubliclyAccessibleAndPaginated() throws Exception {
		mockMvc.perform(get("/api/vehicles?size=2&page=0&sort=label,asc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(6))
				.andExpect(jsonPath("$.content.length()").value(2))
				.andExpect(jsonPath("$.content[0].label").value("B-200"))
				.andExpect(jsonPath("$.content[1].label").value("B-201"))
				.andExpect(jsonPath("$.first").value(true))
				.andExpect(jsonPath("$.last").value(false));
	}

	@Test
	void queryFiltersVehiclesByLabel() throws Exception {
		mockMvc.perform(get("/api/vehicles?query=T-10&size=10&sort=label,asc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(3))
				.andExpect(jsonPath("$.content.length()").value(3))
				.andExpect(jsonPath("$.content[0].label").value("T-100"))
				.andExpect(jsonPath("$.content[2].label").value("T-102"));
	}
}
