import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../config/api/api.config';
import { PageResponse, VehicleResponse, VehiclesQuery } from '../../models/api/api.models';
import { buildVehiclesQueryParams } from './query-params.util';

@Injectable({ providedIn: 'root' })
export class VehiclesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  list(query?: VehiclesQuery): Observable<PageResponse<VehicleResponse>> {
    return this.http.get<PageResponse<VehicleResponse>>(`${this.apiBaseUrl}/vehicles`, {
      params: buildVehiclesQueryParams(query),
    });
  }
}
