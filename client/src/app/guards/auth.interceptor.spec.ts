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

import { Auth } from '../services/auth/auth';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let receivedError: HttpErrorResponse | undefined;

  const authMock = {
    getToken: vi.fn(() => 'expired-token'),
    logout: vi.fn(),
  };

  const routerMock = {
    navigate: vi.fn(() => Promise.resolve(true)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    receivedError = undefined;

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

  it('logs out and redirects when an authenticated request returns 401', () => {
    http.get('/api/posts').subscribe({
      error: (error: HttpErrorResponse) => {
        receivedError = error;
      },
    });

    const request = httpMock.expectOne('/api/posts');

    expect(request.request.headers.get('Authorization')).toBe('Bearer expired-token');

    request.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(authMock.logout).toHaveBeenCalledOnce();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
      replaceUrl: true,
    });
    expect(receivedError?.status).toBe(401);
  });
});
