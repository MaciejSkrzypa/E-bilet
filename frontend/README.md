# Frontend eBilet

Angular frontend dla projektu elektronicznego biletu miejskiego, zintegrowany z backendem Spring Boot z katalogu `../backend`.

## Funkcje

- publiczna oferta biletowa pobierana z `GET /api/offers`
- logowanie i rejestracja pasazera przez JWT
- osobny widok dla `PASSENGER`
- osobny widok dla `INSPECTOR`
- publiczny symulator kasownika dla biletow `SINGLE` i `TIME`
- doladowanie salda, zakup biletow, historia transakcji i lista kodow biletow
- guardy roli, interceptor `Authorization: Bearer ...`, walidacje formularzy i obsluga bledow backendu

## Wymagania

- Node.js 22+
- backend dostepny pod `http://localhost:8080`

Frontend sam wylicza adres backendu jako `http://<hostname>:8080`, zgodnie z CORS ustawionym w backendzie.

## Uruchomienie lokalne

1. Uruchom backend Spring Boot z katalogu `backend/`.
2. W katalogu `frontend/` uruchom:

```bash
npm install
npm run start
```

3. Otworz `http://localhost:4200`.

## Uruchomienie przez Docker Compose

Z katalogu glownego projektu:

```bash
docker compose up --build
```

Frontend bedzie dostepny pod `http://localhost:4200`, backend pod `http://localhost:8080`.

## Konto biletera w development

Backend seeduje konto:

- login: `inspector`
- haslo: `inspector`

## Testy i coverage

```bash
npm run build
npm run test:coverage
```

Ostatnio zweryfikowane coverage:

- Statements: `87.57%`
- Branches: `84.98%`
- Functions: `83.60%`
- Lines: `90.40%`

Raport coverage zapisuje sie w `coverage/frontend/coverage-summary.json`.

## Uwagi

- Backend nie udostepnia endpointu do listy pojazdow, mimo ze `vehicleId` jest wymagane przez kasownik i kontrole biletu.
- Szczegoly analizy backendu, decyzje projektowe i opis tego ograniczenia sa w `../FRONTEND_NOTES.md`.
