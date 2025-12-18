import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/api';

export interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<any> {
    return this.http.post(`/api/users/login`, payload);
  }
}
