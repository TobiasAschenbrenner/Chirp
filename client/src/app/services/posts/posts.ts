import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PostUser {
  _id: string;
  fullName: string;
  profilePhoto: string;
}

export interface Comment {
  _id: string;
  comment: string;
  createdAt?: string;
  creator: string | CommentCreator;
}

export interface Post {
  _id: string;
  creator: string | PostUser;
  body: string;
  image: string;
  likes: string[];
  comments: (string | Comment)[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentCreator {
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
}

@Injectable({ providedIn: 'root' })
export class Posts {
  constructor(private http: HttpClient) {}

  createPost(data: FormData): Observable<Post> {
    return this.http.post<Post>('/api/posts', data);
  }

  getPosts() {
    return this.http.get<Post[]>('/api/posts');
  }

  getFollowingPosts() {
    return this.http.get<Post[]>('/api/posts/following');
  }

  likePost(postId: string) {
    return this.http.get<Post>(`/api/posts/${postId}/like`);
  }

  getPost(id: string) {
    return this.http.get<Post>(`/api/posts/${id}`);
  }

  deletePost(postId: string) {
    return this.http.delete<{ message?: string }>(`/api/posts/${postId}`);
  }

  editPost(postId: string, body: string) {
    return this.http.patch<Post>(`/api/posts/${postId}`, { body });
  }

  toggleBookmark(postId: string) {
    return this.http.get<{ bookmarks: string[] }>(`/api/posts/${postId}/bookmarks`);
  }
}
