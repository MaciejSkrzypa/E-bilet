import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AccountApiService } from './core/services/api/account-api.service';
import { AuthStoreService } from './core/services/auth-store/auth-store.service';
import { App } from './app';

describe('App', () => {
  const passengerUser = {
    id: 1,
    email: 'anna@example.com',
    firstName: 'Anna',
    lastName: 'Nowak',
    dateOfBirth: '1995-04-12',
    role: 'PASSENGER' as const,
    balance: 20,
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

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(() => of(passengerUser)),
            topUp: vi.fn((payload: { amount: number }) =>
              of({
                ...passengerUser,
                balance: passengerUser.balance + payload.amount,
              }),
            ),
          },
        },
      ],
    }).compileComponents();
  });

  it('should render guest navigation when logged out', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Logowanie');
    expect(compiled.textContent).toContain('Rejestracja');
  });

  it('should render balance and top-up button for logged passenger', () => {
    const authStore = TestBed.inject(AuthStoreService);
    authStore.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('20.00 PLN');
    expect(compiled.textContent).toContain('Panel pasażera');
    expect(compiled.textContent).toContain('Wyloguj');
    expect(compiled.textContent).not.toContain('Stan konta');
    expect(compiled.textContent).not.toContain('anna@example.com');
  });

  it('should open top-up modal, allow preset selection and update balance', async () => {
    const authStore = TestBed.inject(AuthStoreService);
    authStore.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();

    component.openTopUpModal();
    fixture.detectChanges();
    expect(component.isTopUpModalOpen()).toBe(true);

    component.selectTopUpAmount(50);
    component.submitTopUp();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authStore.currentUser()?.balance).toBe(70);
    expect(component.isTopUpModalOpen()).toBe(false);
  });

  it('should disable top-up button for invalid negative amount', async () => {
    const authStore = TestBed.inject(AuthStoreService);
    authStore.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();

    component.openTopUpModal();
    component.topUpForm.controls.amount.setValue(-5);
    component.topUpForm.controls.amount.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();

    const submitButton = (Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[]).find(
      (button) => button.textContent?.includes('Doładuj kwotę'),
    ) as HTMLButtonElement | undefined;

    expect(component.topUpForm.invalid).toBe(true);
    expect(submitButton?.disabled).toBe(true);
  });

  it('should not open top-up modal for inspector account', () => {
    const authStore = TestBed.inject(AuthStoreService);
    authStore.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: inspectorUser,
    });

    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();
    authStore.updateUser(inspectorUser);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sprawdź ważność biletu');
    expect(compiled.textContent).toContain('O mnie');
    expect(compiled.textContent).not.toContain('Start');
    expect(compiled.textContent).not.toContain('Kasownik');

    component.openTopUpModal();

    expect(component.isTopUpModalOpen()).toBe(false);
  });

  it('should surface top-up error when request fails', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(() => of(passengerUser)),
            topUp: vi.fn(() => throwError(() => new Error('boom'))),
          },
        },
      ],
    }).compileComponents();

    const authStore = TestBed.inject(AuthStoreService);
    authStore.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();

    component.openTopUpModal();
    component.selectTopUpAmount(20);
    component.submitTopUp();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.topUpError()).toContain('Nie udało się doładować konta.');
    expect(component.isTopUpModalOpen()).toBe(true);
  });

  it('should ignore account refresh error on startup', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(() => throwError(() => new Error('boom'))),
            topUp: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const authStore = TestBed.inject(AuthStoreService);
    authStore.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authStore.currentUser()?.email).toBe('anna@example.com');
  });

  it('should logout current user', () => {
    const authStore = TestBed.inject(AuthStoreService);
    authStore.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();

    component.logout();

    expect(authStore.currentUser()).toBeNull();
  });
});
