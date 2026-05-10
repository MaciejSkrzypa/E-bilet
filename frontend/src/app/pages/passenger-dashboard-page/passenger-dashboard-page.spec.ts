import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AccountApiService } from '../../core/services/api/account-api.service';
import { KasownikApiService } from '../../core/services/api/kasownik-api.service';
import { VehiclesApiService } from '../../core/services/api/vehicles-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { TicketsApiService } from '../../core/services/api/tickets-api.service';
import { PassengerDashboardPageComponent } from './passenger-dashboard-page';

describe('PassengerDashboardPageComponent', () => {
  const user = {
    id: 1,
    email: 'anna@example.com',
    firstName: 'Anna',
    lastName: 'Nowak',
    dateOfBirth: '1995-04-12',
    role: 'PASSENGER' as const,
    balance: 20,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  function createLoggedInStore(): AuthStoreService {
    const store = TestBed.inject(AuthStoreService);
    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user,
    });

    return store;
  }

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

  function createTransactionsPage(content: any[] = [], page = 0, size = 5, totalElements = content.length) {
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

  it('should load passenger dashboard data with paginated transactions', async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerDashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            fragment: of('finance'),
            snapshot: {
              fragment: 'finance',
              data: {},
            },
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(() => of(user)),
            transactions: vi.fn(() =>
              of(
                createTransactionsPage([
                  { id: 1, type: 'TOPUP', amount: 25, createdAt: '2026-05-09T10:00:00', ticketId: null, ticketCode: null },
                ]),
              ),
            ),
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            list: vi.fn(() => of(createTicketsPage())),
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

    createLoggedInStore();
    const fixture = TestBed.createComponent(PassengerDashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Historia finansowa');
    expect(compiled.textContent).toContain('Transakcje konta');
    expect(compiled.textContent).toContain('Doladowanie');
    expect(compiled.textContent).toContain('25.00 PLN');
    expect(compiled.textContent).toContain('1-1 z 1 transakcji');
  });

  it('should render resolved snapshot in profile section', async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerDashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            fragment: of('profile'),
            snapshot: {
              fragment: 'profile',
              data: {
                dashboard: {
                  snapshot: {
                    user,
                    ticketsPage: createTicketsPage([], 0, 5, 2),
                    transactionsPage: createTransactionsPage(
                      [{ id: 1, type: 'TOPUP', amount: 25, createdAt: '2026-05-09T10:00:00', ticketId: null, ticketCode: null }],
                      0,
                      5,
                      3,
                    ),
                  },
                  errorMessage: null,
                },
              },
            },
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(),
            transactions: vi.fn(),
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            list: vi.fn(),
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

    createLoggedInStore();
    const fixture = TestBed.createComponent(PassengerDashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('O mnie');
    expect(compiled.textContent).toContain('anna@example.com');
    expect(compiled.textContent).toContain('Anna');
    expect(compiled.textContent).toContain('Nowak');
    expect(compiled.textContent).toContain('12.04.1995');
    expect(compiled.textContent).toContain('2');
    expect(compiled.textContent).toContain('3');
  });

  it('should request ticket filters through backend query params', async () => {
    const list = vi.fn(() =>
      of(
        createTicketsPage([
          {
            id: 7,
            code: '123e4567-e89b-12d3-a456-426614174000',
            type: 'TIME',
            fare: 'NORMAL',
            price: 3.4,
            purchaseDate: '2026-05-09T10:00:00',
            durationMinutes: 30,
            validFrom: null,
            validTo: null,
            validatedAt: null,
            validatedVehicleId: null,
            validatedVehicleLabel: null,
          },
        ]),
      ),
    );

    await TestBed.configureTestingModule({
      imports: [PassengerDashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            fragment: of('tickets'),
            snapshot: {
              fragment: 'tickets',
              data: {},
            },
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(() => of(user)),
            transactions: vi.fn(() => of(createTransactionsPage())),
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

    createLoggedInStore();
    const fixture = TestBed.createComponent(PassengerDashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(list).toHaveBeenNthCalledWith(1, {
      page: 0,
      size: 5,
      sort: 'purchaseDate,desc',
      type: undefined,
      status: undefined,
    });

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

  it('should validate ticket from passenger tickets section and reload page', async () => {
    const list = vi
      .fn()
      .mockReturnValueOnce(
        of(
          createTicketsPage([
            {
              id: 7,
              code: '123e4567-e89b-12d3-a456-426614174000',
              type: 'TIME',
              fare: 'NORMAL',
              price: 3.4,
              purchaseDate: '2026-05-09T10:00:00',
              durationMinutes: 30,
              validFrom: null,
              validTo: null,
              validatedAt: null,
              validatedVehicleId: null,
              validatedVehicleLabel: null,
            },
          ]),
        ),
      )
      .mockReturnValueOnce(of(createTicketsPage()));
    const validateMock = vi.fn(() =>
      of({
        id: 7,
        code: '123e4567-e89b-12d3-a456-426614174000',
        type: 'TIME',
        fare: 'NORMAL',
        price: 3.4,
        purchaseDate: '2026-05-09T10:00:00',
        durationMinutes: 30,
        validFrom: null,
        validTo: null,
        validatedAt: '2026-05-09T10:11:00',
        validatedVehicleId: 12,
        validatedVehicleLabel: 'T-12',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [PassengerDashboardPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            fragment: of('tickets'),
            snapshot: {
              fragment: 'tickets',
              data: {},
            },
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(() => of(user)),
            transactions: vi.fn(() => of(createTransactionsPage())),
          },
        },
        {
          provide: TicketsApiService,
          useValue: { list },
        },
        {
          provide: KasownikApiService,
          useValue: {
            validate: validateMock,
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

    createLoggedInStore();
    const fixture = TestBed.createComponent(PassengerDashboardPageComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const validateButton = fixture.nativeElement.querySelector('.ticket-action-button') as HTMLButtonElement;
    validateButton.click();
    fixture.detectChanges();

    component.validationForm.setValue({ vehicleQuery: 'T-12', vehicleId: 12 });
    component.submitValidation();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(validateMock).toHaveBeenCalledWith({
      code: '123e4567-e89b-12d3-a456-426614174000',
      vehicleId: 12,
    });
    expect(component.validationSuccess()).toContain('Bilet zostal skasowany poprawnie.');
    expect(list).toHaveBeenCalledTimes(2);
  });
});
