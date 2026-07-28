import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { Auth } from '../services/auth/auth';

const AUTH_ENDPOINTS = ['/users/login', '/users/register', '/users/refresh', '/users/logout'];

const isAuthenticationRequest = (url: string): boolean =>
  AUTH_ENDPOINTS.some((endpoint) => url.endsWith(endpoint));

const addAccessToken = (request: HttpRequest<unknown>, token: string): HttpRequest<unknown> =>
  request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.getToken();

  if (!token || isAuthenticationRequest(req.url)) {
    return next(req);
  }

  const router = inject(Router);

  const endSession = (): void => {
    auth.clearSession();
    void router.navigate(['/login'], { replaceUrl: true });
  };

  const retryWithToken = (nextToken: string) =>
    next(addAccessToken(req, nextToken)).pipe(
      catchError((retryError: HttpErrorResponse) => {
        if (retryError.status === 401) {
          endSession();
        }

        return throwError(() => retryError);
      }),
    );

  return next(addAccessToken(req, token)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const currentToken = auth.getToken();

      if (currentToken && currentToken !== token) {
        return retryWithToken(currentToken);
      }

      return auth.refreshSession().pipe(
        catchError((refreshError: HttpErrorResponse) => {
          endSession();
          return throwError(() => refreshError);
        }),
        switchMap((response) => retryWithToken(response.token)),
      );
    }),
  );
};
