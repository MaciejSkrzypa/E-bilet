import { TestBed } from '@angular/core/testing';

import { LoginResponse } from '../../models/api/api.models';
import { AuthStoreService } from './auth-store.service';

describe('AuthStoreService', () => {
  const response: LoginResponse = {
    token: 'jwt-token',
    expiresAt: '2099-01-01T00:00:00.000Z',
    user: {
      id: 1,
      email: 'anna@example.com',
      firstName: 'Anna',
      lastName: 'Nowak',
      dateOfBirth: '1995-04-12',
      role: 'PASSENGER',
      balance: 20,
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('should persist session on login', () => {
    const store = TestBed.inject(AuthStoreService);

    store.login(response);

    expect(store.isAuthenticated()).toBe(true);
    expect(store.currentUser()?.email).toBe('anna@example.com');
    expect(localStorage.getItem('city-ticket.session')).toContain('jwt-token');
  });

  it('should update stored user data', () => {
    const store = TestBed.inject(AuthStoreService);
    store.login(response);

    store.updateUser({
      ...response.user,
      balance: 99,
    });

    expect(store.currentUser()?.balance).toBe(99);
  });

  it('should restore valid session from localStorage', () => {
    localStorage.setItem(
      'city-ticket.session',
      JSON.stringify({
        token: 'persisted',
        expiresAt: '2099-01-01T00:00:00.000Z',
        user: response.user,
      }),
    );

    const store = TestBed.inject(AuthStoreService);

    expect(store.isAuthenticated()).toBe(true);
    expect(store.token()).toBe('persisted');
  });

  it('should ignore invalid persisted session payload', () => {
    localStorage.setItem('city-ticket.session', '{"token":42}');

    const store = TestBed.inject(AuthStoreService);

    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('city-ticket.session')).toBeNull();
  });

  it('should logout expired session', () => {
    localStorage.setItem(
      'city-ticket.session',
      JSON.stringify({
        token: 'expired',
        expiresAt: '2000-01-01T00:00:00.000Z',
        user: response.user,
      }),
    );

    const store = TestBed.inject(AuthStoreService);

    expect(store.isAuthenticated()).toBe(false);
    expect(store.token()).toBeNull();
  });
});
