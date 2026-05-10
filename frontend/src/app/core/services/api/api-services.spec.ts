import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../config/api/api.config';
import { AccountApiService } from './account-api.service';
import { AuthApiService } from './auth-api.service';
import { InspectionApiService } from './inspection-api.service';
import { KasownikApiService } from './kasownik-api.service';
import { OffersApiService } from './offers-api.service';
import { TicketsApiService } from './tickets-api.service';
import { VehiclesApiService } from './vehicles-api.service';

describe('API services', () => {
  let httpMock: HttpTestingController;
  let authApi: AuthApiService;
  let accountApi: AccountApiService;
  let offersApi: OffersApiService;
  let ticketsApi: TicketsApiService;
  let kasownikApi: KasownikApiService;
  let inspectionApi: InspectionApiService;
  let vehiclesApi: VehiclesApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:8080/api' },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    authApi = TestBed.inject(AuthApiService);
    accountApi = TestBed.inject(AccountApiService);
    offersApi = TestBed.inject(OffersApiService);
    ticketsApi = TestBed.inject(TicketsApiService);
    kasownikApi = TestBed.inject(KasownikApiService);
    inspectionApi = TestBed.inject(InspectionApiService);
    vehiclesApi = TestBed.inject(VehiclesApiService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call login endpoint', () => {
    authApi.login({ email: 'anna@example.com', password: 'secret' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'anna@example.com', password: 'secret' });
    request.flush({});
  });

  it('should call register endpoint', () => {
    authApi
      .register({
        email: 'anna@example.com',
        firstName: 'Anna',
        lastName: 'Nowak',
        dateOfBirth: '1995-04-12',
        password: 'secret123',
      })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/auth/register');
    expect(request.request.method).toBe('POST');
    request.flush({});
  });

  it('should call account endpoints', () => {
    accountApi.me().subscribe();
    accountApi.topUp({ amount: 25 }).subscribe();
    accountApi.transactions({ page: 1, size: 10, sort: 'createdAt,desc' }).subscribe();

    const meRequest = httpMock.expectOne('http://localhost:8080/api/account/me');
    expect(meRequest.request.method).toBe('GET');
    meRequest.flush({});

    const topUpRequest = httpMock.expectOne('http://localhost:8080/api/account/topup');
    expect(topUpRequest.request.method).toBe('POST');
    expect(topUpRequest.request.body).toEqual({ amount: 25 });
    topUpRequest.flush({});

    const transactionsRequest = httpMock.expectOne(
      (request) =>
        request.url === 'http://localhost:8080/api/account/transactions' &&
        request.params.get('page') === '1' &&
        request.params.get('size') === '10' &&
        request.params.get('sort') === 'createdAt,desc',
    );
    expect(transactionsRequest.request.method).toBe('GET');
    transactionsRequest.flush({
      content: [],
      page: 1,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      first: false,
      last: true,
    });
  });

  it('should call offers endpoint', () => {
    offersApi.list({ page: 0, size: 8, sort: 'id,asc', type: ['TIME'] }).subscribe();

    const request = httpMock.expectOne(
      (httpRequest) =>
        httpRequest.url === 'http://localhost:8080/api/offers' &&
        httpRequest.params.get('page') === '0' &&
        httpRequest.params.get('size') === '8' &&
        httpRequest.params.get('sort') === 'id,asc' &&
        httpRequest.params.get('type') === 'TIME',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      content: [],
      page: 0,
      size: 8,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  });

  it('should call ticket endpoints', () => {
    ticketsApi
      .list({
        page: 0,
        size: 5,
        sort: 'purchaseDate,desc',
        type: ['SINGLE', 'TIME'],
        status: ['REQUIRES_VALIDATION', 'ACTIVE'],
      })
      .subscribe();
    ticketsApi.purchase({ offerId: 1, validFrom: null, validTo: null }).subscribe();

    const listRequest = httpMock.expectOne(
      (request) =>
        request.url === 'http://localhost:8080/api/tickets' &&
        request.method === 'GET' &&
        request.params.get('page') === '0' &&
        request.params.get('size') === '5' &&
        request.params.get('sort') === 'purchaseDate,desc' &&
        request.params.get('type') === 'SINGLE,TIME' &&
        request.params.get('status') === 'REQUIRES_VALIDATION,ACTIVE',
    );
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush({
      content: [],
      page: 0,
      size: 5,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });

    const purchaseRequest = httpMock.expectOne(
      (request) => request.url === 'http://localhost:8080/api/tickets' && request.method === 'POST',
    );
    expect(purchaseRequest.request.method).toBe('POST');
    expect(purchaseRequest.request.body).toEqual({ offerId: 1, validFrom: null, validTo: null });
    purchaseRequest.flush({});
  });

  it('should call kasownik endpoint', () => {
    kasownikApi.validate({ code: '123e4567-e89b-12d3-a456-426614174000', vehicleId: 4 }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/kasownik/validate');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.vehicleId).toBe(4);
    request.flush({});
  });

  it('should call inspection endpoint', () => {
    inspectionApi.check({ code: '123e4567-e89b-12d3-a456-426614174000', vehicleId: 2 }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/inspection/check');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.vehicleId).toBe(2);
    request.flush({});
  });

  it('should call vehicles endpoint', () => {
    vehiclesApi.list({ query: 'T-10', size: 6, sort: 'label,asc' }).subscribe();

    const request = httpMock.expectOne(
      (httpRequest) =>
        httpRequest.url === 'http://localhost:8080/api/vehicles' &&
        httpRequest.params.get('query') === 'T-10' &&
        httpRequest.params.get('size') === '6' &&
        httpRequest.params.get('sort') === 'label,asc',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      content: [],
      page: 0,
      size: 6,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  });
});
