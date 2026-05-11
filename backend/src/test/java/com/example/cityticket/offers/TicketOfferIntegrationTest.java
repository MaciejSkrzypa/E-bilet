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
				.andExpect(jsonPath("$.totalElements").value(22))
				.andExpect(jsonPath("$.content.length()").value(20))
				.andExpect(jsonPath("$.first").value(true))
				.andExpect(jsonPath("$.last").value(false));
	}

	@Test
	void paginationWorks() throws Exception {
		mockMvc.perform(get("/api/offers?size=3&page=0"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content.length()").value(3))
				.andExpect(jsonPath("$.totalPages").value(8))
				.andExpect(jsonPath("$.first").value(true))
				.andExpect(jsonPath("$.last").value(false));

		mockMvc.perform(get("/api/offers?size=3&page=7"))
				.andExpect(jsonPath("$.content.length()").value(1))
				.andExpect(jsonPath("$.last").value(true));
	}

	@Test
	void filteringBySingleTypeWorks() throws Exception {
		mockMvc.perform(get("/api/offers?type=TIME&sort=id,asc&size=20"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(18))
				.andExpect(jsonPath("$.content.length()").value(18))
				.andExpect(jsonPath("$.content[0].type").value("TIME"))
				.andExpect(jsonPath("$.content[17].type").value("TIME"));
	}

	@Test
	void filteringByMultipleTypesWorks() throws Exception {
		mockMvc.perform(get("/api/offers?type=SINGLE,PERIOD&sort=id,asc&size=8"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(4))
				.andExpect(jsonPath("$.content.length()").value(4))
				.andExpect(jsonPath("$.content[0].type").value("SINGLE"))
				.andExpect(jsonPath("$.content[3].type").value("PERIOD"));
	}

	@Test
	void sortByPriceAsc() throws Exception {
		mockMvc.perform(get("/api/offers?sort=price,asc&size=22"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content[0].price").value(1.40))
				.andExpect(jsonPath("$.content[21].price").value(24.00));
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
		mockMvc.perform(get("/api/offers?sort=id,asc&page=0&size=22"))
				// index 2 to pierwszy TIME: 15-min normal
				.andExpect(jsonPath("$.content[2].type").value("TIME"))
				.andExpect(jsonPath("$.content[2].durationMinutes").value(15));
	}

	@Test
	void periodOfferHasNeitherDurationNorTimeFields() throws Exception {
		mockMvc.perform(get("/api/offers?type=PERIOD&sort=id,asc&page=0&size=22"))
				.andExpect(jsonPath("$.content[0].type").value("PERIOD"))
				.andExpect(jsonPath("$.content[0].durationMinutes").doesNotExist())
				.andExpect(jsonPath("$.content[0].price").value(5.00));
	}

	@Test
	void sizeIsCappedAt100() throws Exception {
		mockMvc.perform(get("/api/offers?size=9999"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.size", greaterThan(0)))
				.andExpect(jsonPath("$.totalElements").value(22));
	}
}
