import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { AccountApiService } from '../../services/api/account-api.service';
import { TicketsApiService } from '../../services/api/tickets-api.service';
import {
  PASSENGER_TICKETS_PAGE_SIZE,
  PASSENGER_TRANSACTIONS_PAGE_SIZE,
  PassengerDashboardResolvedData,
  passengerDashboardResolver,
} from './passenger-dashboard.resolver';

describe('passengerDashboardResolver', () => {
  it('should resolve passenger dashboard data', async () => {
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
          provide: AccountApiService,
          useValue: {
            me: vi.fn(() =>
              of({
                id: 1,
                email: 'anna@example.com',
                firstName: 'Anna',
                lastName: 'Nowak',
                dateOfBirth: '1995-04-12',
                role: 'PASSENGER',
                balance: 20,
              }),
            ),
            transactions,
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            list,
          },
        },
      ],
    }).compileComponents();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(
        passengerDashboardResolver({} as never, {} as never) as Observable<PassengerDashboardResolvedData>,
      ),
    );

    expect(result.errorMessage).toBeNull();
    expect(result.snapshot?.user.email).toBe('anna@example.com');
    expect(result.snapshot?.ticketsPage.content).toEqual([]);
    expect(list).toHaveBeenCalledWith({
      page: 0,
      size: PASSENGER_TICKETS_PAGE_SIZE,
      sort: 'purchaseDate,desc',
    });
    expect(transactions).toHaveBeenCalledWith({
      page: 0,
      size: PASSENGER_TRANSACTIONS_PAGE_SIZE,
      sort: 'createdAt,desc',
    });
  });

  it('should return fallback payload when resolver request fails', async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: AccountApiService,
          useValue: {
            me: vi.fn(() =>
              of({
                id: 1,
                email: 'anna@example.com',
                firstName: 'Anna',
                lastName: 'Nowak',
                dateOfBirth: '1995-04-12',
                role: 'PASSENGER',
                balance: 20,
              }),
            ),
            transactions: vi.fn(() => of({ content: [], page: 0, size: 5, totalElements: 0, totalPages: 0, first: true, last: true })),
          },
        },
        {
          provide: TicketsApiService,
          useValue: {
            list: vi.fn(() => throwError(() => new Error('Backend down'))),
          },
        },
      ],
    }).compileComponents();

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(
        passengerDashboardResolver({} as never, {} as never) as Observable<PassengerDashboardResolvedData>,
      ),
    );

    expect(result.snapshot).toBeNull();
    expect(result.errorMessage).toBe('Backend down');
  });
});
