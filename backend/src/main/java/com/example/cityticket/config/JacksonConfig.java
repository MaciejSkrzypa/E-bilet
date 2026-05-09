package com.example.cityticket.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
@Configuration
public class JacksonConfig {

	@Bean
	public ObjectMapper objectMapper() {
		return JsonMapper.builder()
				.findAndAddModules()
				.serializationInclusion(JsonInclude.Include.NON_NULL)
				.build();
	}
}
