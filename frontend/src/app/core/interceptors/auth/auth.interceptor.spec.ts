import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthStoreService } from '../../services/auth-store/auth-store.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authStore: AuthStoreService;
  const user = {
    id: 1,
    email: 'anna@example.com',
    firstName: 'Anna',
    lastName: 'Nowak',
    dateOfBirth: '1995-04-12',
    role: 'PASSENGER' as const,
    balance: 5,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStoreService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header for authenticated user', () => {
    authStore.login({
      token: 'jwt-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user,
    });

    http.get('/secured').subscribe();

    const request = httpMock.expectOne('/secured');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush({});
  });

  it('should clear session on 401 response', () => {
    authStore.login({
      token: 'jwt-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user,
    });

    http.get('/secured').subscribe({
      error: () => undefined,
    });

    const request = httpMock.expectOne('/secured');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authStore.isAuthenticated()).toBe(false);
  });

  it('should not add header without token', () => {
    http.get('/public').subscribe();

    const request = httpMock.expectOne('/public');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('should keep session on non-401 error', () => {
    authStore.login({
      token: 'jwt-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user,
    });

    http.get('/secured').subscribe({
      error: () => undefined,
    });

    const request = httpMock.expectOne('/secured');
    request.flush({}, { status: 500, statusText: 'Server error' });

    expect(authStore.isAuthenticated()).toBe(true);
  });
});
