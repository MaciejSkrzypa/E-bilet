# PIISW eBilet

Repo uruchamiamy tylko przez Docker Compose.

## Serwisy i porty

| Serwis | Port | Opis |
| --- | --- | --- |
| `frontend` | `4200` | Angular dev server |
| `backend` | `8080` | REST API + Swagger UI |
| `db` | `5432` | PostgreSQL |
| `pgadmin` | `5050` | podgląd bazy w przeglądarce |

Adresy po starcie:

- frontend: `http://localhost:4200`
- backend API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/docs`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- health: `http://localhost:8080/health`
- pgAdmin: `http://localhost:5050`

## Start projektu

Postawienie całego środowiska:

```bash
docker compose up --build
```

W tle:

```bash
docker compose up -d --build
```

Stan usług:

```bash
docker compose ps
```

Zatrzymanie:

```bash
docker compose down
```

Twardy reset danych i wolumenów:

```bash
docker compose down -v
```

`down -v` usuwa dane Postgresa, pgAdmina, cache Maven i `node_modules` z wolumenu.

## Przydatne komendy Docker

Logi wszystkich usług:

```bash
docker compose logs -f
```

Logi backendu:

```bash
docker compose logs -f backend
```

Logi frontendu:

```bash
docker compose logs -f frontend
```

Wejście do backendu:

```bash
docker compose exec backend bash
```

Wejście do frontendu:

```bash
docker compose exec frontend sh
```

Wejście do bazy:

```bash
docker compose exec db sh
```

CLI do Postgresa:

```bash
docker compose exec db psql -U city_ticket -d city_ticket
```

## Backend

Backend działa w kontenerze `backend` na porcie `8080`.

Najczęstsze komendy:

```bash
docker compose exec backend ./mvnw test
docker compose exec backend ./mvnw -Dtest=TicketOfferIntegrationTest test
docker compose exec backend ./mvnw compile
docker compose exec backend ./mvnw package
```

Po wejściu do kontenera:

```bash
./mvnw test
./mvnw compile
./mvnw package
```

Przydatne endpointy:

- `GET /health`
- `GET /docs`
- `GET /v3/api-docs`

Pełna dokumentacja endpointów jest dostępna w Swagger UI pod `http://localhost:8080/docs`.

## Frontend

Frontend działa w kontenerze `frontend` na porcie `4200`.

Najczęstsze komendy:

```bash
docker compose exec frontend npm test
docker compose exec frontend npm run test:coverage
docker compose exec frontend npm run build
docker compose exec frontend npm run watch
```

Po wejściu do kontenera:

```bash
npm test
npm run test:coverage
npm run build
npm run watch
```

Frontend komunikuje się z backendem pod `http://localhost:8080/api`.

## DataSeeder

Seeder uruchamia się tylko na pustej bazie.
Tworzy:

- 2 konta `INSPECTOR`
- 3 konta `PASSENGER`
- 12 pojazdów
- 22 oferty biletów
- przykładowe bilety i transakcje

Seedowane loginy:

| Email | Rola | Hasło |
| --- | --- | --- |
| `inspector1@example.com` | `INSPECTOR` | `inspector` |
| `inspector2@example.com` | `INSPECTOR` | `inspector` |
| `passenger1@example.com` | `PASSENGER` | `inspector` |
| `passenger2@example.com` | `PASSENGER` | `inspector` |
| `passenger3@example.com` | `PASSENGER` | `inspector` |

Jeśli chcesz odtworzyć seed od zera:

```bash
docker compose down -v
docker compose up --build
```

## pgAdmin

Domyślne logowanie do pgAdmin:

- URL: `http://localhost:5050`
- email: `admin@example.com`
- hasło: `admin`

Jak dodać bazę w pgAdmin:

1. Zaloguj się do `http://localhost:5050`.
2. Kliknij `Add New Server`.
3. W zakładce `General` wpisz dowolną nazwę, np. `eBilet local`.
4. W zakładce `Connection` ustaw:
   - `Host name/address`: `db`
   - `Port`: `5432`
   - `Maintenance database`: `city_ticket`
   - `Username`: `city_ticket`
   - `Password`: `city_ticket`
5. Zapisz formularz.

Ważne: w pgAdmin hostem bazy jest `db`, nie `localhost`, bo pgAdmin działa w osobnym kontenerze.
