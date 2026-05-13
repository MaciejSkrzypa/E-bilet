package com.example.cityticket.config;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class KasownikIntegrationAuthenticationFilter extends OncePerRequestFilter {

	private static final String API_KEY_HEADER = "X-Kasownik-Key";
	private static final String KASOWNIK_INTEGRATION_ROLE = "ROLE_KASOWNIK_INTEGRATION";
	private static final String INTEGRATION_PATH_PREFIX = "/api/integrations/kasownik/";
	private static final String INVALID_KEY_MESSAGE = "Authentication required: missing or invalid kasownik API key";

	private final KasownikIntegrationProperties kasownikIntegrationProperties;

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !request.getRequestURI().startsWith(INTEGRATION_PATH_PREFIX);
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

			if (SecurityContextHolder.getContext().getAuthentication() == null) {
				String apiKey = request.getHeader(API_KEY_HEADER);
				if (apiKey == null || apiKey.isBlank()) {
					request.setAttribute(RestAuthenticationEntryPoint.AUTH_ERROR_ATTRIBUTE, INVALID_KEY_MESSAGE);
				} else {
					kasownikIntegrationProperties.findByApiKey(apiKey.strip())
							.ifPresentOrElse(client -> authenticateClient(client, request),
									() -> request.setAttribute(RestAuthenticationEntryPoint.AUTH_ERROR_ATTRIBUTE,
											INVALID_KEY_MESSAGE));
			}
		}

		filterChain.doFilter(request, response);
	}

	private void authenticateClient(KasownikIntegrationProperties.Client client, HttpServletRequest request) {
		KasownikIntegrationPrincipal principal = new KasownikIntegrationPrincipal(client.getName(), client.getVehicleLabel());
		UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
				principal,
				null,
				List.of(new SimpleGrantedAuthority(KASOWNIK_INTEGRATION_ROLE)));
		authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
		SecurityContextHolder.getContext().setAuthentication(authentication);
	}
}
