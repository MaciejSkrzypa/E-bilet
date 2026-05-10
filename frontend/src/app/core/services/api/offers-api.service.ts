import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../config/api/api.config';
import { OffersQuery, PageResponse, TicketOfferResponse } from '../../models/api/api.models';
import { buildOffersQueryParams } from './query-params.util';

@Injectable({ providedIn: 'root' })
export class OffersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(query?: OffersQuery): Observable<PageResponse<TicketOfferResponse>> {
    return this.http.get<PageResponse<TicketOfferResponse>>(`${this.apiBaseUrl}/offers`, {
      params: buildOffersQueryParams(query),
    });
  }
}
