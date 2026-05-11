import { TestBed } from '@angular/core/testing';

import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { PassengerProfileSectionComponent } from './passenger-profile-section';

describe('PassengerProfileSectionComponent', () => {
  it('should render passenger profile data without summary section', async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [PassengerProfileSectionComponent],
    }).compileComponents();

    const authStore = TestBed.inject(AuthStoreService);
    authStore.login({
      token: 'jwt',
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
    });

    const fixture = TestBed.createComponent(PassengerProfileSectionComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('O mnie');
    expect(compiled.textContent).toContain('anna@example.com');
    expect(compiled.textContent).toContain('Anna');
    expect(compiled.textContent).toContain('Nowak');
    expect(compiled.textContent).toContain('12.04.1995');
    expect(compiled.textContent).not.toContain('Podsumowanie');
    expect(fixture.nativeElement.querySelector('.profile-grid')).not.toBeNull();
  });
});
