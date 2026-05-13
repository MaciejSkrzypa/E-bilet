package com.example.cityticket.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final KasownikIntegrationAuthenticationFilter kasownikIntegrationAuthenticationFilter;
	private final RestAuthenticationEntryPoint authenticationEntryPoint;
	private final RestAccessDeniedHandler accessDeniedHandler;

	private static final String[] PUBLIC_PATHS = {
			"/api/auth/**",
			"/api/offers", "/api/offers/**",
			"/api/vehicles", "/api/vehicles/**",
			"/docs", "/docs/**",
			"/swagger-ui", "/swagger-ui/**",
			"/v3/api-docs", "/v3/api-docs/**"
	};

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
				.csrf(AbstractHttpConfigurer::disable)
				.cors(cors -> {})
				.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
					.exceptionHandling(eh -> eh
							.authenticationEntryPoint(authenticationEntryPoint)
							.accessDeniedHandler(accessDeniedHandler))
					.authorizeHttpRequests(auth -> auth
							.requestMatchers(PUBLIC_PATHS).permitAll()
							.requestMatchers("/api/integrations/kasownik/**").hasRole("KASOWNIK_INTEGRATION")
							.requestMatchers("/api/inspection/**").hasRole("INSPECTOR")
							.requestMatchers("/api/kasownik/**").hasRole("PASSENGER")
							.anyRequest().authenticated())
					.addFilterBefore(kasownikIntegrationAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
					.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
			return http.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
		return cfg.getAuthenticationManager();
	}
}
