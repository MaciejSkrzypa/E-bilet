package com.example.cityticket.offers;

import org.junit.jupiter.api.Test;

import com.example.cityticket.AbstractIntegrationTest;

import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TicketOfferIntegrationTest extends AbstractIntegrationTest {

	@Test
	void listingIsPubliclyAccessibleAndReturnsSeededOffers() throws Exception {
		mockMvc.perform(get("/api/offers"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(8))
				.andExpect(jsonPath("$.content.length()").value(8))
				.andExpect(jsonPath("$.first").value(true))
				.andExpect(jsonPath("$.last").value(true));
	}

	@Test
	void paginationWorks() throws Exception {
		mockMvc.perform(get("/api/offers?size=3&page=0"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content.length()").value(3))
				.andExpect(jsonPath("$.totalPages").value(3))
				.andExpect(jsonPath("$.first").value(true))
				.andExpect(jsonPath("$.last").value(false));

		mockMvc.perform(get("/api/offers?size=3&page=2"))
				.andExpect(jsonPath("$.content.length()").value(2))
				.andExpect(jsonPath("$.last").value(true));
	}

	@Test
	void sortByPriceAsc() throws Exception {
		mockMvc.perform(get("/api/offers?sort=price,asc&size=8"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[0].price").value(1.70))
				.andExpect(jsonPath("$.content[7].price").value(5.00));
	}

	@Test
	void singleOfferHasNoTimeFields() throws Exception {
		mockMvc.perform(get("/api/offers?sort=id,asc"))
				.andExpect(jsonPath("$.content[0].type").value("SINGLE"))
				.andExpect(jsonPath("$.content[0].durationMinutes").doesNotExist())
				.andExpect(jsonPath("$.content[0].price").value(4.40));
	}

	@Test
	void timeOfferHasDurationMinutes() throws Exception {
		mockMvc.perform(get("/api/offers?sort=id,asc&page=0&size=8"))
				// id 3 (index 2) to TIME 30-min normal
				.andExpect(jsonPath("$.content[2].type").value("TIME"))
				.andExpect(jsonPath("$.content[2].durationMinutes").value(30));
	}

	@Test
	void periodOfferHasNeitherDurationNorTimeFields() throws Exception {
		mockMvc.perform(get("/api/offers?sort=id,asc&page=0&size=8"))
				// id 7 (index 6) to PERIOD normal
				.andExpect(jsonPath("$.content[6].type").value("PERIOD"))
				.andExpect(jsonPath("$.content[6].durationMinutes").doesNotExist())
				.andExpect(jsonPath("$.content[6].price").value(5.00));
	}

	@Test
	void sizeIsCappedAt100() throws Exception {
		mockMvc.perform(get("/api/offers?size=9999"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.size", greaterThan(0)))
				.andExpect(jsonPath("$.totalElements").value(8));
	}
}
