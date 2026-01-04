import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
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
  private bookmarkIdsSig = signal<Set<string>>(new Set());

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

  followUnfollow(userId: string) {
    return this.http.get<User>(`/api/users/${userId}/follow-unfollow`);
  }

  changeAvatar(file: File) {
    const fd = new FormData();
    fd.set('avatar', file);
    return this.http.post<User>(`/api/users/avatar`, fd);
  }

  updateProfile(data: { fullName: string; bio: string }) {
    return this.http.patch<User>(`/api/users/edit`, data);
  }

  getBookmarks() {
    return this.http.get<{ bookmarks: Post[] }>(`/api/users/bookmarks`);
  }

  loadBookmarks(): Observable<Set<string>> {
    return this.getBookmarks().pipe(
      map((res) => new Set((res.bookmarks ?? []).map((p) => p._id))),
      tap((ids) => this.bookmarkIdsSig.set(ids))
    );
  }

  bookmarkIds(): Set<string> {
    return this.bookmarkIdsSig();
  }

  isBookmarked(postId: string): boolean {
    return this.bookmarkIdsSig().has(postId);
  }

  setBookmarked(postId: string, bookmarked: boolean): void {
    this.bookmarkIdsSig.update((prev) => {
      const next = new Set(prev);
      if (bookmarked) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }
}
