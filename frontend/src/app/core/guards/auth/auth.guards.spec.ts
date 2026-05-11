import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';

import {
  authGuard,
  guestOnlyGuard,
  inspectorPublicRedirectGuard,
  roleGuard,
} from './auth.guards';
import { AuthStoreService } from '../../services/auth-store/auth-store.service';

describe('auth guards', () => {
  const passengerUser = {
    id: 1,
    email: 'anna@example.com',
    firstName: 'Anna',
    lastName: 'Nowak',
    dateOfBirth: '1995-04-12',
    role: 'PASSENGER' as const,
    balance: 10,
  };
  const inspectorUser = {
    id: 2,
    email: 'inspector@example.com',
    firstName: 'Inspektor',
    lastName: 'Miejski',
    dateOfBirth: '1990-01-01',
    role: 'INSPECTOR' as const,
    balance: 0,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it('should redirect unauthenticated user to homepage', () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/passenger' } as never),
    );

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('should allow authenticated user through authGuard', () => {
    const store = TestBed.inject(AuthStoreService);
    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: { ...passengerUser, balance: 0 },
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/passenger' } as never),
    );

    expect(result).toBe(true);
  });

  it('should redirect guest away from guestOnlyGuard', () => {
    const store = TestBed.inject(AuthStoreService);
    const router = TestBed.inject(Router);
    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: inspectorUser,
    });

    const result = TestBed.runInInjectionContext(() => guestOnlyGuard({} as never, {} as never));

    expect(router.serializeUrl(result as UrlTree)).toBe('/inspector');
  });

  it('should redirect logged passenger away from guestOnlyGuard to finance section', () => {
    const store = TestBed.inject(AuthStoreService);
    const router = TestBed.inject(Router);
    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const result = TestBed.runInInjectionContext(() => guestOnlyGuard({} as never, {} as never));

    expect(router.serializeUrl(result as UrlTree)).toBe('/passenger/finance');
  });

  it('should allow guest through guestOnlyGuard', () => {
    const result = TestBed.runInInjectionContext(() => guestOnlyGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('should block wrong role', () => {
    const store = TestBed.inject(AuthStoreService);
    const router = TestBed.inject(Router);
    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const result = TestBed.runInInjectionContext(() => roleGuard('INSPECTOR')({} as never, {} as never));

    expect(router.serializeUrl(result as UrlTree)).toBe('/passenger/finance');
  });

  it('should redirect unauthenticated user in roleGuard', () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() => roleGuard('INSPECTOR')({} as never, {} as never));

    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('should allow matching role', () => {
    const store = TestBed.inject(AuthStoreService);
    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: inspectorUser,
    });

    const result = TestBed.runInInjectionContext(() => roleGuard('INSPECTOR')({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('should redirect inspector away from public pages', () => {
    const store = TestBed.inject(AuthStoreService);
    const router = TestBed.inject(Router);
    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: inspectorUser,
    });

    const result = TestBed.runInInjectionContext(() =>
      inspectorPublicRedirectGuard({} as never, {} as never),
    );

    expect(router.serializeUrl(result as UrlTree)).toBe('/inspector');
  });

  it('should allow guest through inspector public redirect guard', () => {
    const result = TestBed.runInInjectionContext(() =>
      inspectorPublicRedirectGuard({} as never, {} as never),
    );

    expect(result).toBe(true);
  });

  it('should allow passenger through inspector public redirect guard', () => {
    const store = TestBed.inject(AuthStoreService);
    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const result = TestBed.runInInjectionContext(() =>
      inspectorPublicRedirectGuard({} as never, {} as never),
    );

    expect(result).toBe(true);
  });
});
