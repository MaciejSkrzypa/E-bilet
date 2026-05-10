import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../config/api/api.config';
import { PageResponse, TopUpRequest, TransactionResponse, TransactionsQuery, UserResponse } from '../../models/api/api.models';
import { appendPageQuery } from './query-params.util';

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiBaseUrl}/account/me`);
  }

  topUp(payload: TopUpRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiBaseUrl}/account/topup`, payload);
  }

  transactions(query?: TransactionsQuery): Observable<PageResponse<TransactionResponse>> {
    return this.http.get<PageResponse<TransactionResponse>>(`${this.apiBaseUrl}/account/transactions`, {
      params: appendPageQuery(new HttpParams(), query),
    });
  }
}
