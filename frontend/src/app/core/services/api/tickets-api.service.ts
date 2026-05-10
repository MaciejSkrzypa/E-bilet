import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../config/api/api.config';
import { PageResponse, PurchaseRequest, TicketResponse, TicketsQuery } from '../../models/api/api.models';
import { buildTicketsQueryParams } from './query-params.util';

@Injectable({ providedIn: 'root' })
export class TicketsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(query?: TicketsQuery): Observable<PageResponse<TicketResponse>> {
    return this.http.get<PageResponse<TicketResponse>>(`${this.apiBaseUrl}/tickets`, {
      params: buildTicketsQueryParams(query),
    });
  }

  purchase(payload: PurchaseRequest): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.apiBaseUrl}/tickets`, payload);
  }
}
