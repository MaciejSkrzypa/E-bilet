import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { InspectionApiService } from '../../core/services/api/inspection-api.service';
import { VehiclesApiService } from '../../core/services/api/vehicles-api.service';
import { InspectorDashboardPageComponent } from './inspector-dashboard-page';

describe('InspectorDashboardPageComponent', () => {
  const inspectorUser = {
    id: 2,
    email: 'inspector@example.com',
    firstName: 'Inspektor',
    lastName: 'Miejski',
    dateOfBirth: '1990-01-01',
    role: 'INSPECTOR' as const,
    balance: 0,
  };

  it('should render inspection result', async () => {
    await TestBed.configureTestingModule({
      imports: [InspectorDashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                section: 'check',
              },
            },
            data: of({
              section: 'check',
            }),
          },
        },
        {
          provide: InspectionApiService,
          useValue: {
            check: vi.fn(() =>
              of({
                valid: true,
                reason: 'Single ticket valid in this vehicle',
                ticket: {
                  id: 2,
                  code: '123e4567-e89b-12d3-a456-426614174000',
                  type: 'SINGLE',
                  fare: 'NORMAL',
                  price: 4.4,
                  purchaseDate: '2026-05-09T10:05:00',
                  durationMinutes: null,
                  validFrom: null,
                  validTo: null,
                  validatedAt: '2026-05-09T10:10:00',
                  validatedVehicleId: 1,
                  validatedVehicleLabel: 'T-100',
                },
              }),
            ),
          },
        },
        {
          provide: VehiclesApiService,
          useValue: {
            list: vi.fn(() =>
              of({
                content: [],
                page: 0,
                size: 6,
                totalElements: 0,
                totalPages: 0,
                first: true,
                last: true,
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    const authStore = TestBed.inject(AuthStoreService);
    authStore.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: inspectorUser,
    });

    const fixture = TestBed.createComponent(InspectorDashboardPageComponent);
    const component = fixture.componentInstance as any;
    component.form.setValue({ code: '123e4567-e89b-12d3-a456-426614174000', vehicleQuery: 'T-100', vehicleId: 1 });

    (component as any).submit();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('WAŻNY');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('T-100');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Bilet jednorazowy jest ważny w tym pojeździe.');
  });

  it('should render inspector profile section', async () => {
    await TestBed.configureTestingModule({
      imports: [InspectorDashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                section: 'profile',
              },
            },
            data: of({
              section: 'profile',
            }),
          },
        },
        {
          provide: InspectionApiService,
          useValue: {
            check: vi.fn(),
          },
        },
        {
          provide: VehiclesApiService,
          useValue: {
            list: vi.fn(() =>
              of({
                content: [],
                page: 0,
                size: 6,
                totalElements: 0,
                totalPages: 0,
                first: true,
                last: true,
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    const authStore = TestBed.inject(AuthStoreService);
    authStore.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: inspectorUser,
    });

    const fixture = TestBed.createComponent(InspectorDashboardPageComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('O mnie');
    expect(compiled.textContent).toContain('inspector@example.com');
    expect(compiled.textContent).toContain('01.01.1990');
  });
});
