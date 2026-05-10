package com.example.cityticket.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

public final class AppTime {

	public static final ZoneId APP_ZONE = ZoneId.of("Europe/Warsaw");

	private AppTime() {
	}

	public static LocalDateTime nowDateTime() {
		return LocalDateTime.now(APP_ZONE);
	}

	public static LocalDate today() {
		return LocalDate.now(APP_ZONE);
	}
}
