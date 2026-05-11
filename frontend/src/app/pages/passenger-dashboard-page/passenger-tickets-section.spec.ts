import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { KasownikApiService } from '../../core/services/api/kasownik-api.service';
import { TicketsApiService } from '../../core/services/api/tickets-api.service';
import { VehiclesApiService } from '../../core/services/api/vehicles-api.service';
import { PassengerTicketsSectionComponent } from './passenger-tickets-section';

describe('PassengerTicketsSectionComponent', () => {
  function createTicketsPage(content: any[] = [], page = 0, size = 5, totalElements = content.length) {
    return {
      content,
      page,
      size,
      totalElements,
      totalPages: totalElements === 0 ? 0 : Math.ceil(totalElements / size),
      first: page === 0,
      last: (page + 1) * size >= totalElements,
    };
  }

  function createVehiclePage() {
    return {
      content: [],
      page: 0,
      size: 6,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    };
  }

  const ticket = {
    id: 7,
    code: '123e4567-e89b-12d3-a456-426614174000',
    type: 'TIME' as const,
    fare: 'NORMAL' as const,
    price: 3.4,
    purchaseDate: '2026-05-09T10:00:00',
    durationMinutes: 30,
    validFrom: null,
    validTo: null,
    validatedAt: null,
    validatedVehicleId: null,
    validatedVehicleLabel: null,
  };

  it('should render resolved tickets without extra startup request', async () => {
    const list = vi.fn();

    await TestBed.configureTestingModule({
      imports: [PassengerTicketsSectionComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                tickets: {
                  ticketsPage: createTicketsPage([ticket]),
                  errorMessage: null,
                },
              },
            },
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            list,
          },
        },
        {
          provide: KasownikApiService,
          useValue: {
            validate: vi.fn(),
          },
        },
        {
          provide: VehiclesApiService,
          useValue: {
            list: vi.fn(() => of(createVehiclePage())),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PassengerTicketsSectionComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Moje bilety');
    expect(compiled.textContent).toContain(ticket.code);
    expect(compiled.textContent).toContain('3.40 PLN');
    expect(list).not.toHaveBeenCalled();
  });

  it('should request ticket filters through backend query params', async () => {
    const list = vi.fn(() => of(createTicketsPage([ticket])));

    await TestBed.configureTestingModule({
      imports: [PassengerTicketsSectionComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                tickets: {
                  ticketsPage: createTicketsPage([ticket]),
                  errorMessage: null,
                },
              },
            },
          },
        },
        {
          provide: TicketsApiService,
          useValue: { list },
        },
        {
          provide: KasownikApiService,
          useValue: {
            validate: vi.fn(),
          },
        },
        {
          provide: VehiclesApiService,
          useValue: {
            list: vi.fn(() => of(createVehiclePage())),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PassengerTicketsSectionComponent);
    fixture.detectChanges();

    const filterGroups = fixture.nativeElement.querySelectorAll('.tickets-toolbar .filter-row') as NodeListOf<HTMLElement>;
    const typeButtons = filterGroups[0].querySelectorAll('.filter-chip') as NodeListOf<HTMLButtonElement>;
    typeButtons[0].click();
    fixture.detectChanges();

    const statusButtons = filterGroups[1].querySelectorAll('.filter-chip') as NodeListOf<HTMLButtonElement>;
    statusButtons[1].click();
    fixture.detectChanges();

    const pageSizeSelect = fixture.nativeElement.querySelector('.pagination-size select') as HTMLSelectElement;
    pageSizeSelect.value = '10';
    pageSizeSelect.dispatchEvent(new Event('change'));

    expect(list).toHaveBeenLastCalledWith({
      page: 0,
      size: 10,
      sort: 'purchaseDate,desc',
      type: ['SINGLE'],
      status: ['REQUIRES_VALIDATION'],
    });
  });

  it('should allow only one ticket status filter at a time and change sort accordingly', async () => {
    const list = vi.fn(() => of(createTicketsPage([ticket])));

    await TestBed.configureTestingModule({
      imports: [PassengerTicketsSectionComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                tickets: {
                  ticketsPage: createTicketsPage([ticket]),
                  errorMessage: null,
                },
              },
            },
          },
        },
        {
          provide: TicketsApiService,
          useValue: { list },
        },
        {
          provide: KasownikApiService,
          useValue: {
            validate: vi.fn(),
          },
        },
        {
          provide: VehiclesApiService,
          useValue: {
            list: vi.fn(() => of(createVehiclePage())),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PassengerTicketsSectionComponent);
    fixture.detectChanges();

    const statusButtons = fixture.nativeElement.querySelectorAll(
      '.tickets-toolbar .filter-row:nth-of-type(2) .filter-chip',
    ) as NodeListOf<HTMLButtonElement>;

    statusButtons[0].click();
    fixture.detectChanges();

    expect(list).toHaveBeenLastCalledWith({
      page: 0,
      size: 5,
      sort: 'validatedAt,desc',
      type: undefined,
      status: ['ACTIVE'],
    });

    statusButtons[1].click();
    fixture.detectChanges();

    expect(statusButtons[0].getAttribute('data-active')).toBe('false');
    expect(statusButtons[1].getAttribute('data-active')).toBe('true');
    expect(list).toHaveBeenLastCalledWith({
      page: 0,
      size: 5,
      sort: 'purchaseDate,desc',
      type: undefined,
      status: ['REQUIRES_VALIDATION'],
    });

    statusButtons[2].click();
    fixture.detectChanges();

    expect(list).toHaveBeenLastCalledWith({
      page: 0,
      size: 5,
      sort: 'validatedAt,desc',
      type: undefined,
      status: ['VALIDATED'],
    });

    statusButtons[2].click();
    fixture.detectChanges();

    expect(list).toHaveBeenLastCalledWith({
      page: 0,
      size: 5,
      sort: 'purchaseDate,desc',
      type: undefined,
      status: undefined,
    });
  });

  it('should validate ticket and reload current page', async () => {
    const list = vi.fn(() => of(createTicketsPage()));
    const validate = vi.fn(() =>
      of({
        ...ticket,
        validatedAt: '2026-05-09T10:11:00',
        validatedVehicleId: 12,
        validatedVehicleLabel: 'T-12',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [PassengerTicketsSectionComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                tickets: {
                  ticketsPage: createTicketsPage([ticket]),
                  errorMessage: null,
                },
              },
            },
          },
        },
        {
          provide: TicketsApiService,
          useValue: { list },
        },
        {
          provide: KasownikApiService,
          useValue: {
            validate,
          },
        },
        {
          provide: VehiclesApiService,
          useValue: {
            list: vi.fn(() => of(createVehiclePage())),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PassengerTicketsSectionComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();

    const validateButton = fixture.nativeElement.querySelector('.ticket-action-button') as HTMLButtonElement;
    validateButton.click();
    fixture.detectChanges();

    component.validationForm.setValue({ vehicleQuery: 'T-12', vehicleId: 12 });
    component.submitValidation();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(validate).toHaveBeenCalledWith({
      code: ticket.code,
      vehicleId: 12,
    });
    expect(component.validationSuccess()).toContain('Bilet został skasowany poprawnie.');
    expect(list).toHaveBeenCalledTimes(1);
  });
});
