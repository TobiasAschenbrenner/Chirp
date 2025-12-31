import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

import { Post } from '../posts/posts';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  profilePhoto: string;
  bio?: string;
  followers?: string[];
  following?: string[];
  posts?: string[];
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

  getUserPosts(id: string) {
    return this.http.get<{ posts: Post[] }>(`/api/users/${id}/posts`);
  }
}
