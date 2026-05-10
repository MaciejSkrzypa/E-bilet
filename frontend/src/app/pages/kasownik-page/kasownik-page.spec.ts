import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { KasownikApiService } from '../../core/services/api/kasownik-api.service';
import { TicketsApiService } from '../../core/services/api/tickets-api.service';
import { VehiclesApiService } from '../../core/services/api/vehicles-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { TicketResponse } from '../../core/models/api/api.models';
import { KasownikPageComponent } from './kasownik-page';

describe('KasownikPageComponent', () => {
  const baseTicket: TicketResponse = {
    id: 2,
    code: '123e4567-e89b-12d3-a456-426614174000',
    type: 'TIME',
    fare: 'NORMAL',
    price: 3.4,
    purchaseDate: '2026-05-09T10:05:00',
    durationMinutes: 30,
    validFrom: null,
    validTo: null,
    validatedAt: null,
    validatedVehicleId: null,
    validatedVehicleLabel: null,
  };

  it('should render validation success for manual code entry', async () => {
    const validate = vi.fn(() =>
      of({
        ...baseTicket,
        validatedAt: '2026-05-09T10:10:00',
        validatedVehicleId: 1,
        validatedVehicleLabel: 'T-100',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [KasownikPageComponent],
      providers: [
        {
          provide: AuthStoreService,
          useValue: {
            role: () => null,
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            list: vi.fn(() =>
              of({
                content: [],
                page: 0,
                size: 100,
                totalElements: 0,
                totalPages: 0,
                first: true,
                last: true,
              }),
            ),
          },
        },
        {
          provide: KasownikApiService,
          useValue: { validate },
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

    const fixture = TestBed.createComponent(KasownikPageComponent);
    const component = fixture.componentInstance as any;
    component.form.patchValue({ code: baseTicket.code, vehicleQuery: 'T-100', vehicleId: 1 });

    component.submit();
    fixture.detectChanges();

    expect(validate).toHaveBeenCalledWith({ code: baseTicket.code, vehicleId: 1 });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Bilet zostal skasowany poprawnie');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('T-100');
  });

  it('should allow passenger to validate owned ticket selected from the list', async () => {
    const ownedTicket: TicketResponse = {
      ...baseTicket,
      id: 8,
      code: '223e4567-e89b-12d3-a456-426614174111',
      type: 'SINGLE',
      price: 4.4,
    };
    const validate = vi.fn(() =>
      of({
        ...ownedTicket,
        validatedAt: '2026-05-09T10:15:00',
        validatedVehicleId: 7,
        validatedVehicleLabel: 'A-12',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [KasownikPageComponent],
      providers: [
        {
          provide: AuthStoreService,
          useValue: {
            role: () => 'PASSENGER',
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            list: vi.fn(() =>
              of({
                content: [ownedTicket],
                page: 0,
                size: 100,
                totalElements: 1,
                totalPages: 1,
                first: true,
                last: true,
              }),
            ),
          },
        },
        {
          provide: KasownikApiService,
          useValue: { validate },
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

    const fixture = TestBed.createComponent(KasownikPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    expect(component.validationMode()).toBe('ticket');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Wybierz moj bilet');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('UUID biletu');

    component.form.patchValue({ vehicleQuery: 'A-12', vehicleId: 7 });
    component.submit();
    fixture.detectChanges();

    expect(validate).toHaveBeenCalledWith({ code: ownedTicket.code, vehicleId: 7 });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('A-12');
  });
});
