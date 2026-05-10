import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthApiService } from '../../core/services/api/auth-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { LoginPageComponent } from './login-page';

describe('LoginPageComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should log user in and redirect by role', async () => {
    const loginMock = vi.fn(() =>
      of({
        token: 'jwt',
        expiresAt: '2099-01-01T00:00:00.000Z',
        user: {
          id: 1,
          email: 'anna@example.com',
          firstName: 'Anna',
          lastName: 'Nowak',
          dateOfBirth: '1995-04-12',
          role: 'PASSENGER',
          balance: 10,
        },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: { login: loginMock } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const navigateCommandsSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPageComponent);
    const component = fixture.componentInstance as any;

    component.form.setValue({ email: 'anna@example.com', password: 'secret' });
    fixture.detectChanges();

    component.submit();

    expect(loginMock).toHaveBeenCalledWith({ email: 'anna@example.com', password: 'secret' });
    expect(TestBed.inject(AuthStoreService).currentUser()?.email).toBe('anna@example.com');
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(navigateCommandsSpy).toHaveBeenCalledWith(['/passenger'], {
      fragment: 'finance',
      replaceUrl: true,
    });
  });

  it('should honor redirectTo query param after login', async () => {
    const loginMock = vi.fn(() =>
      of({
        token: 'jwt',
        expiresAt: '2099-01-01T00:00:00.000Z',
        user: {
          id: 1,
          email: 'anna@example.com',
          firstName: 'Anna',
          lastName: 'Nowak',
          dateOfBirth: '1995-04-12',
          role: 'PASSENGER',
          balance: 10,
        },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: { login: loginMock } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => '/passenger#tickets',
              },
            },
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPageComponent);
    const component = fixture.componentInstance as any;

    component.form.setValue({ email: 'anna@example.com', password: 'secret' });
    fixture.detectChanges();

    component.submit();

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/passenger#tickets', { replaceUrl: true });
  });

  it('should expose backend error', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthApiService,
          useValue: {
            login: vi.fn(() => throwError(() => new Error('Invalid credentials'))),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginPageComponent);
    const component = fixture.componentInstance as any;
    component.form.setValue({ email: 'anna@example.com', password: 'bad' });

    component.submit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Invalid credentials');
  });
});
