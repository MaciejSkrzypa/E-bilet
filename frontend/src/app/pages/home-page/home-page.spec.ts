import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AccountApiService } from '../../core/services/api/account-api.service';
import { PageResponse, TicketOfferResponse } from '../../core/models/api/api.models';
import { OffersApiService } from '../../core/services/api/offers-api.service';
import { TicketsApiService } from '../../core/services/api/tickets-api.service';
import { AuthStoreService } from '../../core/services/auth-store/auth-store.service';
import { HomePageComponent } from './home-page';

describe('HomePageComponent', () => {
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

  beforeEach(() => {
    localStorage.clear();
  });

  function createOffers(): TicketOfferResponse[] {
    return [
      {
        id: 1,
        type: 'SINGLE',
        fare: 'NORMAL',
        price: 4.4,
        durationMinutes: null,
      },
      {
        id: 2,
        type: 'TIME',
        fare: 'REDUCED',
        price: 1.7,
        durationMinutes: 30,
      },
      {
        id: 3,
        type: 'PERIOD',
        fare: 'NORMAL',
        price: 5,
        durationMinutes: null,
      },
    ];
  }

  function createOffersPage(content = createOffers(), page = 0, size = 8): PageResponse<TicketOfferResponse> {
    return {
      content,
      page,
      size,
      totalElements: content.length,
      totalPages: 1,
      first: true,
      last: true,
    };
  }

  function createPagedOffers(page: number, size: number, totalElements: number, first: boolean, last: boolean) {
    return {
      content: createOffers().slice(page * size, page * size + size),
      page,
      size,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
      first,
      last,
    } satisfies PageResponse<TicketOfferResponse>;
  }

  it('should render paginated offers with purchase actions', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: OffersApiService,
          useValue: {
            list: vi.fn(() => of(createOffersPage())),
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            purchase: vi.fn(),
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Jednorazowy');
    expect(compiled.textContent).toContain('Czasowy');
    expect(compiled.textContent).toContain('Okresowy');
    expect(compiled.textContent).toContain('za dzień');
    expect(compiled.textContent).toContain('Kup teraz');
    expect(compiled.textContent).toContain('1-3 z 3 ofert');
  });

  it('should request offer filters through backend query params', async () => {
    const list = vi.fn(() => of(createOffersPage()));

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: OffersApiService,
          useValue: {
            list,
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            purchase: vi.fn(),
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const filterButtons = fixture.nativeElement.querySelectorAll('.filter-chip') as NodeListOf<HTMLButtonElement>;
    filterButtons[0].click();
    fixture.detectChanges();

    expect(list).toHaveBeenLastCalledWith({
      page: 0,
      size: 8,
      sort: 'id,asc',
      type: ['SINGLE'],
    });
  });

  it('should request another page size for offers', async () => {
    const list = vi.fn(() => of(createOffersPage()));

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: OffersApiService,
          useValue: { list },
        },
        {
          provide: TicketsApiService,
          useValue: {
            purchase: vi.fn(),
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePageComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();

    component.changeOfferPageSize(4);

    expect(list).toHaveBeenLastCalledWith({
      page: 0,
      size: 4,
      sort: 'id,asc',
    });
  });

  it('should react to homepage filter and pagination controls from template', async () => {
    const list = vi
      .fn()
      .mockReturnValueOnce(of(createPagedOffers(0, 2, 3, true, false)))
      .mockReturnValueOnce(of(createPagedOffers(1, 2, 3, false, true)));

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: OffersApiService,
          useValue: { list },
        },
        {
          provide: TicketsApiService,
          useValue: {
            purchase: vi.fn(),
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const paginationButtons = fixture.nativeElement.querySelectorAll('.pagination-button') as NodeListOf<HTMLButtonElement>;
    paginationButtons[1].click();
    fixture.detectChanges();

    expect(list).toHaveBeenLastCalledWith({
      page: 1,
      size: 2,
      sort: 'id,asc',
    });
  });

  it('should redirect guest to login when trying to buy ticket', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: OffersApiService,
          useValue: {
            list: vi.fn(() => of(createOffersPage())),
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            purchase: vi.fn(),
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HomePageComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();

    component.buyOffer(createOffers()[0]);

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect inspector to forbidden when trying to buy ticket', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: OffersApiService,
          useValue: {
            list: vi.fn(() => of(createOffersPage())),
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            purchase: vi.fn(),
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const store = TestBed.inject(AuthStoreService);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: inspectorUser,
    });

    const fixture = TestBed.createComponent(HomePageComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();

    component.buyOffer(createOffers()[0]);

    expect(navigateSpy).toHaveBeenCalledWith(['/forbidden']);
  });

  it('should open period modal and preview daily price for passenger', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: OffersApiService,
          useValue: {
            list: vi.fn(() => of(createOffersPage())),
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            purchase: vi.fn(),
          },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const store = TestBed.inject(AuthStoreService);
    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const fixture = TestBed.createComponent(HomePageComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();

    component.buyOffer(createOffers()[2]);
    component.periodPurchaseForm.setValue({
      validFrom: '2099-01-01',
      validTo: '2099-01-07',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Potwierdzenie zakupu');
    expect(compiled.textContent).toContain('35.00 PLN');
    expect(compiled.querySelector('.modal-close-x')).not.toBeNull();
    expect(component.canConfirmPurchase()).toBe(true);
  });

  it('should purchase ticket and refresh account balance', async () => {
    const purchase = vi.fn(() =>
      of({
        id: 10,
        code: '123e4567-e89b-12d3-a456-426614174000',
        type: 'SINGLE',
        fare: 'NORMAL',
        price: 4.4,
        purchaseDate: '2026-05-09T10:00:00',
        durationMinutes: null,
        validFrom: null,
        validTo: null,
        validatedAt: null,
        validatedVehicleId: null,
        validatedVehicleLabel: null,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: OffersApiService,
          useValue: {
            list: vi.fn(() => of(createOffersPage())),
          },
        },
        {
          provide: TicketsApiService,
          useValue: { purchase },
        },
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(() =>
              of({
                ...passengerUser,
                balance: 15.6,
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    const store = TestBed.inject(AuthStoreService);
    store.login({
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: passengerUser,
    });

    const fixture = TestBed.createComponent(HomePageComponent);
    const component = fixture.componentInstance as any;
    fixture.detectChanges();
    await fixture.whenStable();

    component.buyOffer(createOffers()[0]);
    component.confirmPurchase();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(purchase).toHaveBeenCalledWith({ offerId: 1, validFrom: null, validTo: null });
    expect(store.currentUser()?.balance).toBe(15.6);
    expect(component.purchaseMessage()).toContain('Kod biletu');
  });
});
