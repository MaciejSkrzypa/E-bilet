package com.example.cityticket.config;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.example.cityticket.dto.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

	public static final String AUTH_ERROR_ATTRIBUTE = "auth_error_message";

	private final ObjectMapper objectMapper;

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException authException) throws IOException {

		String reason = (String) request.getAttribute(AUTH_ERROR_ATTRIBUTE);
		if (reason == null) {
			reason = "Authentication required: missing or invalid Bearer token";
		}

		response.setStatus(HttpStatus.UNAUTHORIZED.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		objectMapper.writeValue(
				response.getOutputStream(),
				ApiError.of(HttpStatus.UNAUTHORIZED.value(), reason, request.getRequestURI()));
	}
}
