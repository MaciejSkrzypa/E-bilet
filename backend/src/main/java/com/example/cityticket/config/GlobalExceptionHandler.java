package com.example.cityticket.config;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import com.example.cityticket.dto.ApiError;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
		int status = ex.getStatusCode().value();
		String message = ex.getReason() != null ? ex.getReason() : HttpStatus.valueOf(status).getReasonPhrase();
		return ResponseEntity.status(status).body(ApiError.of(status, message, request.getRequestURI()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
		List<String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
				.map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
				.toList();
		return ResponseEntity.badRequest()
				.body(ApiError.validation("Request validation failed", request.getRequestURI(), fieldErrors));
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex,
			HttpServletRequest request) {
		List<String> violations = ex.getConstraintViolations().stream()
				.map(v -> v.getPropertyPath() + ": " + v.getMessage())
				.toList();
		return ResponseEntity.badRequest()
				.body(ApiError.validation("Constraint violation", request.getRequestURI(), violations));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleUnreadableMessage(HttpMessageNotReadableException ex,
			HttpServletRequest request) {
		String message = "Malformed request body: " + (ex.getMostSpecificCause() != null
				? ex.getMostSpecificCause().getMessage()
				: ex.getMessage());
		return ResponseEntity.badRequest()
				.body(ApiError.of(HttpStatus.BAD_REQUEST.value(), message, request.getRequestURI()));
	}
}
