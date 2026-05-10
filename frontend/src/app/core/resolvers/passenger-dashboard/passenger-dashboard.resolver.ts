import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';

import { PageResponse, TicketResponse, TransactionResponse, UserResponse } from '../../models/api/api.models';
import { AccountApiService } from '../../services/api/account-api.service';
import { TicketsApiService } from '../../services/api/tickets-api.service';
import { getErrorMessage } from '../../../shared/utils/http-error/http-error.util';

export const PASSENGER_TICKETS_PAGE_SIZE = 5;
export const PASSENGER_TRANSACTIONS_PAGE_SIZE = 5;

export interface PassengerSnapshot {
  user: UserResponse;
  ticketsPage: PageResponse<TicketResponse>;
  transactionsPage: PageResponse<TransactionResponse>;
}

export interface PassengerDashboardResolvedData {
  snapshot: PassengerSnapshot | null;
  errorMessage: string | null;
}

export const passengerDashboardResolver: ResolveFn<PassengerDashboardResolvedData> = () => {
  const accountApi = inject(AccountApiService);
  const ticketsApi = inject(TicketsApiService);

  return forkJoin({
    user: accountApi.me(),
    ticketsPage: ticketsApi.list({
      page: 0,
      size: PASSENGER_TICKETS_PAGE_SIZE,
      sort: 'purchaseDate,desc',
    }),
    transactionsPage: accountApi.transactions({
      page: 0,
      size: PASSENGER_TRANSACTIONS_PAGE_SIZE,
      sort: 'createdAt,desc',
    }),
  }).pipe(
    map((snapshot) => ({
      snapshot,
      errorMessage: null,
    })),
    catchError((error) =>
      of({
        snapshot: null,
        errorMessage: getErrorMessage(error, 'Nie udalo sie zaladowac danych pasazera.'),
      }),
    ),
  );
};
