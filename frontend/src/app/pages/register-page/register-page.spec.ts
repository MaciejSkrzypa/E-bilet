import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthApiService } from '../../core/services/api/auth-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { RegisterPageComponent } from './register-page';

describe('RegisterPageComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should validate password confirmation', async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthApiService,
          useValue: {
            register: vi.fn(),
            login: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterPageComponent);
    const component = fixture.componentInstance as any;

    component.form.setValue({
      email: 'anna@example.com',
      firstName: 'Anna',
      lastName: 'Nowak',
      dateOfBirth: '1995-04-12',
      password: 'secret1',
      confirmPassword: 'secret2',
    });
    component.form.markAllAsTouched();
    fixture.detectChanges();

    expect(component.form.hasError('fieldsMismatch')).toBe(true);
  });

  it('should register and auto-login user', async () => {
    const registeredUser = {
      id: 1,
      email: 'anna@example.com',
      firstName: 'Anna',
      lastName: 'Nowak',
      dateOfBirth: '1995-04-12',
      role: 'PASSENGER' as const,
      balance: 0,
    };

    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthApiService,
          useValue: {
            register: vi.fn(() => of(registeredUser)),
            login: vi.fn(() =>
              of({
                token: 'jwt',
                expiresAt: '2099-01-01T00:00:00.000Z',
                user: registeredUser,
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegisterPageComponent);
    const component = fixture.componentInstance as any;

    component.form.setValue({
      email: 'anna@example.com',
      firstName: 'Anna',
      lastName: 'Nowak',
      dateOfBirth: '1995-04-12',
      password: 'secret1',
      confirmPassword: 'secret1',
    });

    component.submit();

    expect(TestBed.inject(AuthStoreService).currentUser()?.email).toBe('anna@example.com');
    expect(navigateSpy).toHaveBeenCalledWith(['/passenger'], {
      fragment: 'finance',
      replaceUrl: true,
    });
  });
});
