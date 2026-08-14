import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { Auth } from './auth';
import { LoginPayload, LoginResponse, RegisterPayload } from '../../models/auth.model';

describe('Auth service', () => {
  let service: Auth;
  let httpMock: HttpTestingController;

  let store: Record<string, string>;
  const TOKEN_KEY = 'chirp_token';
  const USER_ID_KEY = 'chirp_user_id';

  beforeEach(() => {
    store = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((...args: unknown[]) => {
      const key = String(args[0]);
      return store[key] ?? null;
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((...args: unknown[]) => {
      const key = String(args[0]);
      const value = String(args[1]);
      store[key] = value;
    });

    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((...args: unknown[]) => {
      const key = String(args[0]);
      delete store[key];
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Auth],
    });

    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('login(): should POST /api/users/login and store token + user id', () => {
    const payload: LoginPayload = { email: 'tobi@test.com', password: 'pw' };

    let received: LoginResponse | undefined;
    service.login(payload).subscribe((res) => (received = res));

    const req = httpMock.expectOne('/api/users/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({ token: 't123', id: 'u123' } satisfies LoginResponse);

    expect(received).toEqual({ token: 't123', id: 'u123' });

    expect(localStorage.getItem(TOKEN_KEY)).toBe('t123');
    expect(localStorage.getItem(USER_ID_KEY)).toBe('u123');

    expect(req.request.withCredentials).toBe(true);
  });

  it('logout(): should clear the session and revoke the refresh token', () => {
    localStorage.setItem(TOKEN_KEY, 't123');
    localStorage.setItem(USER_ID_KEY, 'u123');

    service.logout();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_ID_KEY)).toBeNull();

    const req = httpMock.expectOne('/api/users/logout');

    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);

    req.flush(null, {
      status: 204,
      statusText: 'No Content',
    });
  });

  it('isLoggedIn(): should be true when token exists', () => {
    expect(service.isLoggedIn()).toBe(false);

    localStorage.setItem(TOKEN_KEY, 't123');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('getToken(): should read token from localStorage', () => {
    expect(service.getToken()).toBeNull();

    localStorage.setItem(TOKEN_KEY, 't123');
    expect(service.getToken()).toBe('t123');
  });

  it('getUserId(): should read user id from localStorage', () => {
    expect(service.getUserId()).toBeNull();

    localStorage.setItem(USER_ID_KEY, 'u123');
    expect(service.getUserId()).toBe('u123');
  });

  it('register(): should POST /api/users/register with payload', () => {
    const payload: RegisterPayload = {
      fullName: 'Tobi A',
      email: 'tobi@test.com',
      password: 'pw',
      confirmPassword: 'pw',
    };

    service.register(payload).subscribe();

    const req = httpMock.expectOne('/api/users/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({ ok: true });
  });

  it('login(): should not write to localStorage if request errors', () => {
    const payload: LoginPayload = { email: 'tobi@test.com', password: 'pw' };

    service.login(payload).subscribe({
      next: () => {},
      error: () => {},
    });

    const req = httpMock.expectOne('/api/users/login');
    req.flush({ message: 'nope' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_ID_KEY)).toBeNull();
  });

  it('refreshSession(): should share one request and persist the new session', () => {
    const responses: LoginResponse[] = [];

    service.refreshSession().subscribe((response) => {
      responses.push(response);
    });

    service.refreshSession().subscribe((response) => {
      responses.push(response);
    });

    const req = httpMock.expectOne('/api/users/refresh');

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.withCredentials).toBe(true);

    req.flush({
      token: 'fresh-token',
      id: 'u123',
    } satisfies LoginResponse);

    expect(responses).toEqual([
      { token: 'fresh-token', id: 'u123' },
      { token: 'fresh-token', id: 'u123' },
    ]);

    expect(localStorage.getItem(TOKEN_KEY)).toBe('fresh-token');
    expect(localStorage.getItem(USER_ID_KEY)).toBe('u123');
  });
});
