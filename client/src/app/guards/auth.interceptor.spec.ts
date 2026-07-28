import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Auth } from '../services/auth/auth';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let receivedError: HttpErrorResponse | undefined;

  const authMock = {
    getToken: vi.fn(() => 'expired-token'),
    refreshSession: vi.fn(() =>
      of({
        token: 'fresh-token',
        id: 'user-id',
      }),
    ),
    clearSession: vi.fn(),
  };

  const routerMock = {
    navigate: vi.fn(() => Promise.resolve(true)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    receivedError = undefined;

    authMock.getToken.mockReturnValue('expired-token');
    authMock.refreshSession.mockReturnValue(
      of({
        token: 'fresh-token',
        id: 'user-id',
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Auth, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('refreshes and retries an authenticated request after 401', () => {
    let responseBody:
      | {
          success: boolean;
        }
      | undefined;

    http.get<{ success: boolean }>('/api/posts').subscribe({
      next: (response) => {
        responseBody = response;
      },
    });

    const initialRequest = httpMock.expectOne('/api/posts');

    expect(initialRequest.request.headers.get('Authorization')).toBe('Bearer expired-token');

    initialRequest.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    const retriedRequest = httpMock.expectOne('/api/posts');

    expect(authMock.refreshSession).toHaveBeenCalledOnce();
    expect(retriedRequest.request.headers.get('Authorization')).toBe('Bearer fresh-token');

    retriedRequest.flush({ success: true });

    expect(responseBody).toEqual({ success: true });
    expect(authMock.clearSession).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('clears the session when refreshing fails', () => {
    authMock.refreshSession.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
          }),
      ),
    );

    http.get('/api/posts').subscribe({
      error: (error: HttpErrorResponse) => {
        receivedError = error;
      },
    });

    const request = httpMock.expectOne('/api/posts');

    request.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(authMock.refreshSession).toHaveBeenCalledOnce();
    expect(authMock.clearSession).toHaveBeenCalledOnce();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    expect(receivedError?.status).toBe(401);
  });

  it('does not intercept refresh endpoint failures', () => {
    http.post('/api/users/refresh', {}).subscribe({
      error: (error: HttpErrorResponse) => {
        receivedError = error;
      },
    });

    const request = httpMock.expectOne('/api/users/refresh');

    expect(request.request.headers.get('Authorization')).toBeNull();

    request.flush(
      { message: 'Invalid refresh token' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(authMock.refreshSession).not.toHaveBeenCalled();
    expect(authMock.clearSession).not.toHaveBeenCalled();
    expect(receivedError?.status).toBe(401);
  });

  it('does not refresh after a non-401 error', () => {
    http.get('/api/posts').subscribe({
      error: (error: HttpErrorResponse) => {
        receivedError = error;
      },
    });

    const request = httpMock.expectOne('/api/posts');

    request.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(authMock.refreshSession).not.toHaveBeenCalled();
    expect(authMock.clearSession).not.toHaveBeenCalled();
    expect(receivedError?.status).toBe(403);
  });
});
