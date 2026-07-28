import { Component, OnInit, signal } from '@angular/core';

import { Observable } from 'rxjs';

import { CreatePost } from '../../components/create-post/create-post';
import { ForYouOrFollowing } from '../../components/for-you-or-following/for-you-or-following';
import { FeedSkeleton } from '../../components/feed-skeleton/feed-skeleton';
import { Feeds } from '../../components/feeds/feeds';

import { Posts } from '../../services/posts/posts';
import { Post } from '../../models/post.model';
import { Users } from '../../services/users/users';
import { ApiError } from '../../models/api-error.model';
import { FeedMode } from '../../models/feed-mode.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CreatePost, ForYouOrFollowing, FeedSkeleton, Feeds],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  mode = signal<FeedMode>('foryou');
  posts = signal<Post[]>([]);
  bookmarkedIds = signal<ReadonlySet<string>>(new Set<string>());

  loading = signal(false);
  posting = signal(false);
  error = signal('');

  constructor(private usersApi: Users, private postsApi: Posts) {}

  ngOnInit(): void {
    this.loadPosts();
    this.loadBookmarks();
  }

  onModeChange(mode: FeedMode): void {
    this.mode.set(mode);
    this.loadPosts();
  }

  onPostUpdated(updated: Post): void {
    this.posts.update((posts) => posts.map((p) => (p._id === updated._id ? updated : p)));
  }

  onPostDeleted(postId: string): void {
    this.posts.update((posts) => posts.filter((p) => p._id !== postId));
  }

  createPost(data: FormData): void {
    this.error.set('');
    this.posting.set(true);

    this.postsApi.createPost(data).subscribe({
      next: (newPost) => {
        this.posting.set(false);

        if (this.mode() === 'foryou') {
          this.posts.update((posts) => [newPost, ...posts]);
        } else {
          this.loadPosts();
        }
      },
      error: (err: ApiError) => {
        this.posting.set(false);

        const msg = err.error?.message || 'Failed to create post.';
        this.error.set(
          msg === "TypeError: Cannot read properties of null (reading 'image')"
            ? 'Please upload an image'
            : msg
        );
      },
    });
  }

  private getPostsRequest(): Observable<Post[]> {
    return this.mode() === 'foryou' ? this.postsApi.getPosts() : this.postsApi.getFollowingPosts();
  }

  private loadPosts(): void {
    this.loading.set(true);

    this.getPostsRequest().subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        console.log('Load posts failed:', err);
        this.loading.set(false);
      },
    });
  }

  private loadBookmarks(): void {
    this.usersApi.getBookmarks().subscribe({
      next: (res) => {
        const ids = new Set<string>(res.bookmarks.map((p) => p._id));
        this.bookmarkedIds.set(ids);
      },
      error: (err: ApiError) => console.log(err),
    });
  }
}
