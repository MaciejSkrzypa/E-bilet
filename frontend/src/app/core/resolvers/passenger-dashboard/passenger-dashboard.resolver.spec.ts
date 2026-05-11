import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { AccountApiService } from '../../services/api/account-api.service';
import { TicketsApiService } from '../../services/api/tickets-api.service';
import {
  PASSENGER_TICKETS_PAGE_SIZE,
  PASSENGER_TRANSACTIONS_PAGE_SIZE,
  PassengerTicketsResolvedData,
  PassengerTransactionsResolvedData,
  passengerTicketsResolver,
  passengerTransactionsResolver,
} from './passenger-dashboard.resolver';

describe('passenger dashboard resolvers', () => {
  it('should resolve transactions for finance section', async () => {
    const transactions = vi.fn(() =>
      of({
        content: [],
        page: 0,
        size: PASSENGER_TRANSACTIONS_PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }),
    );

    await TestBed.configureTestingModule({
      providers: [
        {
          provide: AccountApiService,
          useValue: {
            transactions,
          },
        },
      ],
    }).compileComponents();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(
        passengerTransactionsResolver({} as never, {} as never) as Observable<PassengerTransactionsResolvedData>,
      ),
    );

    expect(result.errorMessage).toBeNull();
    expect(result.transactionsPage?.size).toBe(PASSENGER_TRANSACTIONS_PAGE_SIZE);
    expect(transactions).toHaveBeenCalledWith({
      page: 0,
      size: PASSENGER_TRANSACTIONS_PAGE_SIZE,
      sort: 'createdAt,desc',
    });
  });

  it('should resolve tickets for tickets section', async () => {
    const list = vi.fn(() =>
      of({
        content: [],
        page: 0,
        size: PASSENGER_TICKETS_PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      }),
    );

    await TestBed.configureTestingModule({
      providers: [
        {
          provide: TicketsApiService,
          useValue: {
            list,
          },
        },
      ],
    }).compileComponents();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(passengerTicketsResolver({} as never, {} as never) as Observable<PassengerTicketsResolvedData>),
    );

    expect(result.errorMessage).toBeNull();
    expect(result.ticketsPage?.size).toBe(PASSENGER_TICKETS_PAGE_SIZE);
    expect(list).toHaveBeenCalledWith({
      page: 0,
      size: PASSENGER_TICKETS_PAGE_SIZE,
      sort: 'purchaseDate,desc',
    });
  });

  it('should return fallback payload when finance resolver request fails', async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: AccountApiService,
          useValue: {
            transactions: vi.fn(() => throwError(() => new Error('Transactions offline'))),
          },
        },
      ],
    }).compileComponents();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(
        passengerTransactionsResolver({} as never, {} as never) as Observable<PassengerTransactionsResolvedData>,
      ),
    );

    expect(result.transactionsPage).toBeNull();
    expect(result.errorMessage).toBe('Transactions offline');
  });

  it('should return fallback payload when tickets resolver request fails', async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: TicketsApiService,
          useValue: {
            list: vi.fn(() => throwError(() => new Error('Tickets offline'))),
          },
        },
      ],
    }).compileComponents();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(passengerTicketsResolver({} as never, {} as never) as Observable<PassengerTicketsResolvedData>),
    );

    expect(result.ticketsPage).toBeNull();
    expect(result.errorMessage).toBe('Tickets offline');
  });
});
