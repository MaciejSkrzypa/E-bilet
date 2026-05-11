import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { PageResponse, TicketResponse, TransactionResponse } from '../../models/api/api.models';
import { AccountApiService } from '../../services/api/account-api.service';
import { TicketsApiService } from '../../services/api/tickets-api.service';
import { getErrorMessage } from '../../../shared/utils/http-error/http-error.util';

export const PASSENGER_TICKETS_PAGE_SIZE = 5;
export const PASSENGER_TRANSACTIONS_PAGE_SIZE = 5;

export interface PassengerTicketsResolvedData {
  ticketsPage: PageResponse<TicketResponse> | null;
  errorMessage: string | null;
}

export interface PassengerTransactionsResolvedData {
  transactionsPage: PageResponse<TransactionResponse> | null;
  errorMessage: string | null;
}

export const passengerTicketsResolver: ResolveFn<PassengerTicketsResolvedData> = () => {
  const ticketsApi = inject(TicketsApiService);

  return ticketsApi
    .list({
      page: 0,
      size: PASSENGER_TICKETS_PAGE_SIZE,
      sort: 'purchaseDate,desc',
    })
    .pipe(
      map((ticketsPage) => ({
        ticketsPage,
        errorMessage: null,
      })),
      catchError((error) =>
        of({
          ticketsPage: null,
          errorMessage: getErrorMessage(error, 'Nie udalo sie zaladowac listy biletow.'),
        }),
      ),
    );
};

export const passengerTransactionsResolver: ResolveFn<PassengerTransactionsResolvedData> = () => {
  const accountApi = inject(AccountApiService);

  return accountApi
    .transactions({
      page: 0,
      size: PASSENGER_TRANSACTIONS_PAGE_SIZE,
      sort: 'createdAt,desc',
    })
    .pipe(
      map((transactionsPage) => ({
        transactionsPage,
        errorMessage: null,
      })),
      catchError((error) =>
        of({
          transactionsPage: null,
          errorMessage: getErrorMessage(error, 'Nie udalo sie zaladowac historii transakcji.'),
        }),
      ),
    );
};
