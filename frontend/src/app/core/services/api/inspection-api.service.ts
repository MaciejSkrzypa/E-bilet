import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../config/api/api.config';
import { InspectionRequest, InspectionResponse } from '../../models/api/api.models';

@Injectable({ providedIn: 'root' })
export class InspectionApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  check(payload: InspectionRequest): Observable<InspectionResponse> {
    return this.http.post<InspectionResponse>(`${this.apiBaseUrl}/inspection/check`, payload);
  }
}
