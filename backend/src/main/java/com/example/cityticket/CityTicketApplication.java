package com.example.cityticket;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CityTicketApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("Europe/Warsaw"));
		SpringApplication.run(CityTicketApplication.class, args);
	}

}
