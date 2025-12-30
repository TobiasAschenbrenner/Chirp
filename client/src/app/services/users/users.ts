import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface User {
  _id: string;
  fullName: string;
  profilePhoto?: string;
}

@Injectable({ providedIn: 'root' })
export class Users {
  private cache = new Map<string, Observable<User>>();

  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<User> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const req$ = this.http.get<User>(`/api/users/${id}`).pipe(shareReplay(1));
    this.cache.set(id, req$);
    return req$;
  }
}
