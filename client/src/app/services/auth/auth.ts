import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, Observable, shareReplay, tap } from 'rxjs';

import { LoginPayload, LoginResponse, RegisterPayload } from '../../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Auth {
  private static readonly TOKEN_KEY = 'chirp_token';
  private static readonly USER_ID_KEY = 'chirp_user_id';

  private readonly baseUrl = environment.apiUrl;
  private refreshRequest$: Observable<LoginResponse> | null = null;

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/users/login`, payload, { withCredentials: true })
      .pipe(tap((response) => this.persistSession(response)));
  }

  register(payload: RegisterPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/users/register`, payload);
  }

  refreshSession(): Observable<LoginResponse> {
    if (!this.refreshRequest$) {
      this.refreshRequest$ = this.http
        .post<LoginResponse>(`${this.baseUrl}/users/refresh`, {}, { withCredentials: true })
        .pipe(
          tap((response) => this.persistSession(response)),
          finalize(() => {
            this.refreshRequest$ = null;
          }),
          shareReplay({
            bufferSize: 1,
            refCount: false,
          }),
        );
    }

    return this.refreshRequest$;
  }

  logout(): void {
    this.clearSession();

    this.http.post<void>(`${this.baseUrl}/users/logout`, {}, { withCredentials: true }).subscribe({
      error: () => undefined,
    });
  }

  clearSession(): void {
    this.remove(Auth.TOKEN_KEY);
    this.remove(Auth.USER_ID_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return this.read(Auth.TOKEN_KEY);
  }

  getUserId(): string | null {
    return this.read(Auth.USER_ID_KEY);
  }

  private persistSession(response: LoginResponse): void {
    this.setToken(response.token);
    this.setUserId(response.id);
  }

  private setToken(token: string): void {
    this.write(Auth.TOKEN_KEY, token);
  }

  private setUserId(id: string): void {
    this.write(Auth.USER_ID_KEY, id);
  }

  private read(key: string): string | null {
    return localStorage.getItem(key);
  }

  private write(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  private remove(key: string): void {
    localStorage.removeItem(key);
  }
}
