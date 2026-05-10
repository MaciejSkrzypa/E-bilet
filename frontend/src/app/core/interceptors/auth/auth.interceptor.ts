import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthStoreService } from '../../services/auth-store/auth-store.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStoreService);
  const token = authStore.token();

  const authorizedRequest = token
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authStore.logout();
      }

      return throwError(() => error);
    }),
  );
};
