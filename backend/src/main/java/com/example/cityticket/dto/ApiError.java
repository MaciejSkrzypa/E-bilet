package com.example.cityticket.dto;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
		int status,
		String error,
		String message,
		String path,
		Instant timestamp,
		List<String> errors) {

	public static ApiError of(int status, String message, String path) {
		return new ApiError(
				status,
				HttpStatus.valueOf(status).getReasonPhrase(),
				message,
				path,
				Instant.now(),
				null);
	}

	public static ApiError validation(String message, String path, List<String> fieldErrors) {
		return new ApiError(
				HttpStatus.BAD_REQUEST.value(),
				HttpStatus.BAD_REQUEST.getReasonPhrase(),
				message,
				path,
				Instant.now(),
				fieldErrors);
	}
}
