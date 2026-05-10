import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../config/api/api.config';
import { TicketResponse, ValidationRequest } from '../../models/api/api.models';

@Injectable({ providedIn: 'root' })
export class KasownikApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  validate(payload: ValidationRequest): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(`${this.apiBaseUrl}/kasownik/validate`, payload);
  }
}
