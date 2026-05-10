import { HttpParams } from '@angular/common/http';

import { OffersQuery, PageQuery, TicketFilterStatus, TicketsQuery, TicketType, VehiclesQuery } from '../../models/api/api.models';

export function appendPageQuery(params: HttpParams = new HttpParams(), query?: PageQuery): HttpParams {
  let nextParams = params;

  if (typeof query?.page === 'number') {
    nextParams = nextParams.set('page', String(query.page));
  }

  if (typeof query?.size === 'number') {
    nextParams = nextParams.set('size', String(query.size));
  }

  if (Array.isArray(query?.sort)) {
    for (const sort of query.sort) {
      nextParams = nextParams.append('sort', sort);
    }
  } else if (typeof query?.sort === 'string' && query.sort.length > 0) {
    nextParams = nextParams.set('sort', query.sort);
  }

  return nextParams;
}

export function buildTicketsQueryParams(query?: TicketsQuery): HttpParams {
  let params = appendPageQuery(new HttpParams(), query);

  if (query?.type && query.type.length > 0) {
    params = appendTicketTypes(params, query.type);
  }

  if (query?.status && query.status.length > 0) {
    params = appendTicketStatuses(params, query.status);
  }

  if (typeof query?.validated === 'boolean') {
    params = params.set('validated', String(query.validated));
  }

  if (typeof query?.active === 'boolean') {
    params = params.set('active', String(query.active));
  }

  return params;
}

export function buildOffersQueryParams(query?: OffersQuery): HttpParams {
  let params = appendPageQuery(new HttpParams(), query);

  if (query?.type && query.type.length > 0) {
    params = appendTicketTypes(params, query.type);
  }

  return params;
}

export function buildVehiclesQueryParams(query?: VehiclesQuery): HttpParams {
  let params = appendPageQuery(new HttpParams(), query);

  if (typeof query?.query === 'string' && query.query.trim().length > 0) {
    params = params.set('query', query.query.trim());
  }

  return params;
}

function appendTicketTypes(params: HttpParams, types: readonly TicketType[]): HttpParams {
  return params.set('type', types.join(','));
}

function appendTicketStatuses(params: HttpParams, statuses: readonly TicketFilterStatus[]): HttpParams {
  return params.set('status', statuses.join(','));
}
