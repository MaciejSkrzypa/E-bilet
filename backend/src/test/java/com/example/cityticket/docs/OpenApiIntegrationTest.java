package com.example.cityticket.docs;

import org.junit.jupiter.api.Test;

import com.example.cityticket.AbstractIntegrationTest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OpenApiIntegrationTest extends AbstractIntegrationTest {

	@Test
	void exposesKasownikIntegrationEndpointWithApiKeySecurityScheme() throws Exception {
		mockMvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$['paths']['/api/integrations/kasownik/validate']['post']").exists())
				.andExpect(jsonPath("$['paths']['/api/integrations/kasownik/validate']['post']['security'][0]['kasownikApiKey']").isArray())
				.andExpect(jsonPath("$['components']['securitySchemes']['kasownikApiKey']['type']").value("apiKey"))
				.andExpect(jsonPath("$['components']['securitySchemes']['kasownikApiKey']['name']").value("X-Kasownik-Key"))
				.andExpect(jsonPath("$['components']['securitySchemes']['kasownikApiKey']['in']").value("header"));
	}
}
